import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.zip.ZipFile;
import org.objectweb.asm.ClassReader;
import org.objectweb.asm.Type;
import org.objectweb.asm.tree.*;

/** Classfile-only audit. Does not load Minecraft or apply runtime transformers. */
public final class CoreMixinBindingAudit {
    private static final Gson JSON = new Gson();
    private final List<ZipFile> providers = new ArrayList<>();
    private final Map<String, ClassNode> cache = new HashMap<>();
    private final Map<String, String> owners = new HashMap<>();

    private ClassNode read(String name) throws Exception {
        if (cache.containsKey(name)) return cache.get(name);
        byte[] bytes = null;
        for (var provider : providers) {
            var entry = provider.getEntry(name + ".class");
            if (entry == null) continue;
            try (var stream = provider.getInputStream(entry)) { bytes = stream.readAllBytes(); }
            owners.put(name, provider.getName());
            break;
        }
        if (bytes == null && name.startsWith("java/")) {
            try (InputStream stream = ClassLoader.getSystemResourceAsStream(name + ".class")) {
                if (stream != null) { bytes = stream.readAllBytes(); owners.put(name, "JDK"); }
            }
        }
        ClassNode node = null;
        if (bytes != null) {
            node = new ClassNode();
            new ClassReader(bytes).accept(node, ClassReader.SKIP_DEBUG | ClassReader.SKIP_FRAMES);
        }
        cache.put(name, node);
        return node;
    }

    private static List<AnnotationNode> annotations(List<AnnotationNode> first, List<AnnotationNode> second) {
        var result = new ArrayList<AnnotationNode>();
        if (first != null) result.addAll(first);
        if (second != null) result.addAll(second);
        return result;
    }

    private static Object value(AnnotationNode annotation, String name) {
        if (annotation.values == null) return null;
        for (int i = 0; i < annotation.values.size(); i += 2)
            if (annotation.values.get(i).equals(name)) return annotation.values.get(i + 1);
        return null;
    }

    private boolean methodExists(String target, String selector, Set<String> visited) throws Exception {
        if (target == null || !visited.add(target)) return false;
        var node = read(target);
        if (node == null) return false;
        int start = selector.indexOf('(');
        String name = start < 0 ? selector : selector.substring(0, start);
        String descriptor = start < 0 ? null : selector.substring(start);
        for (var method : node.methods)
            if (method.name.equals(name) && (descriptor == null || method.desc.equals(descriptor))) return true;
        if (name.equals("<init>") || name.equals("<clinit>")) return false;
        if (methodExists(node.superName, selector, visited)) return true;
        for (String parent : node.interfaces)
            if (methodExists(parent, selector, visited)) return true;
        return false;
    }

    private boolean fieldExists(String target, String name, String descriptor, Set<String> visited) throws Exception {
        if (target == null || !visited.add(target)) return false;
        var node = read(target);
        if (node == null) return false;
        for (var field : node.fields)
            if (field.name.equals(name) && field.desc.equals(descriptor)) return true;
        if (fieldExists(node.superName, name, descriptor, visited)) return true;
        for (String parent : node.interfaces)
            if (fieldExists(parent, name, descriptor, visited)) return true;
        return false;
    }

    private List<MethodNode> selectedMethods(String target, String selector, Set<String> visited) throws Exception {
        var result = new ArrayList<MethodNode>();
        if (target == null || !visited.add(target)) return result;
        var node = read(target);
        if (node == null) return result;
        int start = selector.indexOf('(');
        String name = start < 0 ? selector : selector.substring(0, start);
        String descriptor = start < 0 ? null : selector.substring(start);
        for (var method : node.methods)
            if (method.name.equals(name) && (descriptor == null || method.desc.equals(descriptor))) result.add(method);
        if (result.isEmpty() && !name.equals("<init>") && !name.equals("<clinit>")) {
            result.addAll(selectedMethods(node.superName, selector, visited));
            for (String parent : node.interfaces) result.addAll(selectedMethods(parent, selector, visited));
        }
        return result;
    }

    private List<Map<String, Object>> sites(String target, String selector, AnnotationNode injection) throws Exception {
        var result = new ArrayList<Map<String, Object>>();
        Object at = value(injection, "at");
        var points = new ArrayList<AnnotationNode>();
        if (at instanceof AnnotationNode point) points.add(point);
        if (at instanceof List<?> list) for (Object point : list) points.add((AnnotationNode) point);
        for (var point : points) {
            String kind = String.valueOf(value(point, "value"));
            if (!kind.equals("INVOKE") && !kind.equals("INVOKE_ASSIGN") && !kind.equals("FIELD") && !kind.equals("NEW")) continue;
            String member = String.valueOf(value(point, "target"));
            if (kind.equals("NEW")) {
                if (!member.startsWith("(")) {
                    result.add(Map.of("kind", kind, "target", member, "status", "NON_LITERAL_SITE_REQUIRES_REVIEW"));
                    continue;
                }
                Type constructor = Type.getMethodType(member);
                String owner = constructor.getReturnType().getInternalName();
                String descriptor = Type.getMethodDescriptor(Type.VOID_TYPE, constructor.getArgumentTypes());
                int allocations = 0, calls = 0;
                for (var method : selectedMethods(target, selector, new HashSet<>())) {
                    for (var instruction : method.instructions) {
                        if (instruction instanceof TypeInsnNode allocation && allocation.getOpcode() == 187 && allocation.desc.equals(owner)) allocations++;
                        if (instruction instanceof MethodInsnNode call && call.owner.equals(owner) && call.name.equals("<init>") && call.desc.equals(descriptor)) calls++;
                    }
                }
                result.add(Map.of("kind", kind, "target", member, "allocations", allocations, "constructorCalls", calls,
                    "status", allocations > 0 && calls > 0 ? "BASE_SITE_PRESENT" : "BASE_SITE_ABSENT_REQUIRES_REVIEW"));
                continue;
            }
            boolean invocation = kind.equals("INVOKE") || kind.equals("INVOKE_ASSIGN");
            int ownerEnd = member.indexOf(';');
            if (!member.startsWith("L") || ownerEnd < 2) {
                result.add(Map.of("kind", kind, "target", member, "status", "NON_LITERAL_SITE_REQUIRES_REVIEW"));
                continue;
            }
            String owner = member.substring(1, ownerEnd), rest = member.substring(ownerEnd + 1);
            int split = rest.indexOf(invocation ? '(' : ':');
            if (split < 1) throw new IllegalArgumentException("Malformed literal injection site: " + member);
            String name = rest.substring(0, split), descriptor = rest.substring(split + (kind.equals("FIELD") ? 1 : 0));
            int count = 0, maximumInOneMethod = 0;
            for (var method : selectedMethods(target, selector, new HashSet<>())) {
                int methodCount = 0;
                for (var instruction : method.instructions) {
                    if (invocation && instruction instanceof MethodInsnNode call
                            && call.owner.equals(owner) && call.name.equals(name) && call.desc.equals(descriptor)) methodCount++;
                    if (kind.equals("FIELD") && instruction instanceof FieldInsnNode field
                            && field.owner.equals(owner) && field.name.equals(name) && field.desc.equals(descriptor)) methodCount++;
                }
                count += methodCount;
                maximumInOneMethod = Math.max(maximumInOneMethod, methodCount);
            }
            int ordinal = value(point, "ordinal") instanceof Integer number ? number : -1;
            boolean optional = Integer.valueOf(0).equals(value(injection, "require"));
            var row = new LinkedHashMap<String, Object>();
            row.put("kind", kind); row.put("target", member); row.put("baseOccurrences", count);
            row.put("maximumOccurrencesInOneMethod", maximumInOneMethod);
            row.put("ordinal", ordinal); row.put("explicitRequireZero", optional);
            row.put("hasSlice", value(injection, "slice") != null);
            row.put("status", maximumInOneMethod > Math.max(ordinal, 0) ? "BASE_SITE_PRESENT"
                : optional ? "OPTIONAL_BASE_SITE_ABSENT" : "BASE_SITE_ABSENT_REQUIRES_REVIEW");
            result.add(row);
        }
        return result;
    }

    private List<Map<String, Object>> constants(String target, String selector, AnnotationNode injection) throws Exception {
        var result = new ArrayList<Map<String, Object>>();
        Object annotations = value(injection, "constant");
        if (!(annotations instanceof List<?> list)) return result;
        for (Object entry : list) {
            var annotation = (AnnotationNode) entry;
            Object wanted = value(annotation, "intValue");
            String kind = "INT";
            if (wanted == null) { wanted = value(annotation, "floatValue"); kind = "FLOAT"; }
            if (wanted == null) { wanted = value(annotation, "stringValue"); kind = "STRING"; }
            if (wanted == null) {
                result.add(Map.of("kind", "CONSTANT", "status", "UNSUPPORTED_CONSTANT_REQUIRES_REVIEW"));
                continue;
            }
            int count = 0, maximumInOneMethod = 0;
            for (var method : selectedMethods(target, selector, new HashSet<>())) {
                int methodCount = 0;
                for (var instruction : method.instructions) {
                    // Separate branches preserve numeric wrapper types and avoid
                    // ternary numeric promotion/unboxing of a null sentinel.
                    Object actual = null;
                    int opcode = instruction.getOpcode();
                    if (instruction instanceof LdcInsnNode literal) actual = literal.cst;
                    else if (instruction instanceof IntInsnNode integer && (opcode == 16 || opcode == 17)) actual = integer.operand;
                    else if (opcode >= 2 && opcode <= 8) actual = opcode - 3;
                    else if (opcode >= 11 && opcode <= 13) actual = (float) (opcode - 11);
                    if (wanted.equals(actual)) methodCount++;
                }
                count += methodCount;
                maximumInOneMethod = Math.max(maximumInOneMethod, methodCount);
            }
            int ordinal = value(annotation, "ordinal") instanceof Integer number ? number : -1;
            result.add(Map.of("kind", "CONSTANT_" + kind, "value", wanted, "baseOccurrences", count,
                "maximumOccurrencesInOneMethod", maximumInOneMethod, "ordinal", ordinal,
                "status", maximumInOneMethod > Math.max(ordinal, 0) ? "BASE_SITE_PRESENT" : "BASE_SITE_ABSENT_REQUIRES_REVIEW"));
        }
        return result;
    }

    private static List<String> shadowNames(String name, AnnotationNode annotation) {
        var result = new ArrayList<String>();
        String prefix = value(annotation, "prefix") instanceof String text ? text : "shadow$";
        result.add(name.startsWith(prefix) ? name.substring(prefix.length()) : name);
        if (value(annotation, "aliases") instanceof List<?> aliases)
            for (Object alias : aliases) result.add(alias.toString());
        return result;
    }

    private Map<String, Object> audit(String mixin) throws Exception {
        var node = read(mixin);
        if (node == null) throw new IllegalStateException("Configured Core mixin absent: " + mixin);
        var targets = new ArrayList<String>();
        boolean pseudo = false;
        for (var annotation : annotations(node.visibleAnnotations, node.invisibleAnnotations)) {
            if (annotation.desc.equals("Lorg/spongepowered/asm/mixin/Pseudo;")) pseudo = true;
            if (!annotation.desc.equals("Lorg/spongepowered/asm/mixin/Mixin;")) continue;
            Object classes = value(annotation, "value"), names = value(annotation, "targets");
            if (classes instanceof List<?> list) for (Object item : list) targets.add(((Type) item).getInternalName());
            if (names instanceof List<?> list) for (Object item : list) targets.add(item.toString().replace('.', '/'));
        }
        if (targets.isEmpty()) throw new IllegalStateException("No explicit target in " + mixin);
        var rows = new ArrayList<Map<String, Object>>();
        for (String target : targets) {
            boolean found = read(target) != null;
            var selectors = new ArrayList<Map<String, Object>>();
            var members = new ArrayList<Map<String, Object>>();
            for (var field : node.fields) {
                for (var annotation : annotations(field.visibleAnnotations, field.invisibleAnnotations)) {
                    if (!annotation.desc.equals("Lorg/spongepowered/asm/mixin/Shadow;")) continue;
                    boolean present = false;
                    for (String name : shadowNames(field.name, annotation))
                        present |= fieldExists(target, name, field.desc, new HashSet<>());
                    members.add(Map.of("kind", "SHADOW_FIELD", "name", field.name, "descriptor", field.desc,
                        "status", present ? "MEMBER_PRESENT" : "MEMBER_ABSENT_REQUIRES_REVIEW"));
                }
            }
            for (var method : node.methods) {
                for (var annotation : annotations(method.visibleAnnotations, method.invisibleAnnotations)) {
                    if (annotation.desc.equals("Lorg/spongepowered/asm/mixin/Shadow;")) {
                        boolean present = false;
                        for (String name : shadowNames(method.name, annotation))
                            present |= methodExists(target, name + method.desc, new HashSet<>());
                        members.add(Map.of("kind", "SHADOW_METHOD", "name", method.name, "descriptor", method.desc,
                            "status", present ? "MEMBER_PRESENT" : "MEMBER_ABSENT_REQUIRES_REVIEW"));
                    }
                    if (annotation.desc.equals("Lorg/spongepowered/asm/mixin/gen/Accessor;")
                            || annotation.desc.equals("Lorg/spongepowered/asm/mixin/gen/Invoker;")) {
                        Object selectedMember = value(annotation, "value");
                        if (!(selectedMember instanceof String name) || name.isEmpty()) {
                            members.add(Map.of("kind", "INFERRED_ACCESSOR", "name", method.name,
                                "descriptor", method.desc, "status", "INFERRED_NAME_REQUIRES_REVIEW"));
                        } else {
                            boolean accessor = annotation.desc.contains("/Accessor;");
                            Type[] parameters = Type.getArgumentTypes(method.desc);
                            String descriptor = accessor ? (parameters.length == 0 ? Type.getReturnType(method.desc)
                                : parameters[0]).getDescriptor() : name.equals("<init>")
                                ? Type.getMethodDescriptor(Type.VOID_TYPE, parameters) : method.desc;
                            boolean present = accessor ? fieldExists(target, name, descriptor, new HashSet<>())
                                : methodExists(target, name + descriptor, new HashSet<>());
                            members.add(Map.of("kind", accessor ? "ACCESSOR" : "INVOKER", "name", name,
                                "descriptor", descriptor, "status", present ? "MEMBER_PRESENT" : "MEMBER_ABSENT_REQUIRES_REVIEW"));
                        }
                    }
                    Object selected = value(annotation, "method");
                    if (!(selected instanceof List<?> list)) continue;
                    for (Object entry : list) {
                        String selector = entry.toString();
                        boolean literal = !selector.contains("*") && !selector.startsWith("@") && !selector.contains("/");
                        // Slashes inside a descriptor are ordinary class names.
                        if (selector.indexOf('(') >= 0 && !selector.substring(0, selector.indexOf('(')).contains("/"))
                            literal = !selector.contains("*") && !selector.startsWith("@");
                        var record = new LinkedHashMap<String, Object>();
                        record.put("handler", method.name); record.put("annotation", annotation.desc);
                        record.put("selector", selector);
                        record.put("status", !literal ? "DYNAMIC_SELECTOR" : !found ? "TARGET_ABSENT"
                            : methodExists(target, selector, new HashSet<>()) ? "BASE_METHOD_PRESENT" : "BASE_METHOD_ABSENT_REQUIRES_REVIEW");
                        if (literal && found) {
                            var points = sites(target, selector, annotation);
                            points.addAll(constants(target, selector, annotation));
                            record.put("sites", points);
                        }
                        selectors.add(record);
                    }
                }
            }
            var row = new LinkedHashMap<String, Object>();
            row.put("target", target); row.put("status", found ? "CLASS_PRESENT" : "CLASS_ABSENT_REQUIRES_REVIEW");
            row.put("provider", owners.get(target)); row.put("selectors", selectors); row.put("members", members); rows.add(row);
        }
        return Map.of("mixin", mixin, "pseudo", pseudo, "targets", rows);
    }

    public static void main(String[] args) throws Exception {
        if (args.length == 1 && args[0].equals("--self-test")) {
            var audit = new CoreMixinBindingAudit();
            var base = new ClassNode(); base.name = "fixture/Base";
            base.methods.add(new MethodNode(1, "work", "(I)V", null, null));
            base.fields.add(new FieldNode(1, "state", "J", null, null));
            var child = new ClassNode(); child.name = "fixture/Child"; child.superName = base.name;
            audit.cache.put(base.name, base); audit.cache.put(child.name, child);
            if (!audit.methodExists(child.name, "work(I)V", new HashSet<>()))
                throw new AssertionError("Inherited selector was missed");
            if (audit.methodExists(child.name, "work(J)V", new HashSet<>()))
                throw new AssertionError("Changed descriptor was silently accepted");
            if (audit.methodExists(child.name, "missing", new HashSet<>()))
                throw new AssertionError("Missing member was silently accepted");
            if (!audit.fieldExists(child.name, "state", "J", new HashSet<>())
                    || audit.fieldExists(child.name, "state", "I", new HashSet<>()))
                throw new AssertionError("Inherited exact field type was not checked");
            var instruction = new MethodInsnNode(184, "fixture/API", "call", "()V", false);
            base.methods.getFirst().instructions.add(instruction);
            var point = new AnnotationNode("Lorg/spongepowered/asm/mixin/injection/At;");
            point.values = new ArrayList<>(List.of("value", "INVOKE", "target", "Lfixture/API;call()V"));
            var injection = new AnnotationNode("Lorg/spongepowered/asm/mixin/injection/Inject;");
            injection.values = new ArrayList<>(List.of("at", List.of(point)));
            if (!audit.sites(child.name, "work(I)V", injection).getFirst().get("status").equals("BASE_SITE_PRESENT"))
                throw new AssertionError("Exact inherited call site was missed");
            instruction.name = "renamed";
            if (!audit.sites(child.name, "work(I)V", injection).getFirst().get("status").equals("BASE_SITE_ABSENT_REQUIRES_REVIEW"))
                throw new AssertionError("Moved call site was silently accepted");
            instruction.name = "call";
            point.values.addAll(List.of("ordinal", 1));
            if (!audit.sites(child.name, "work(I)V", injection).getFirst().get("status").equals("BASE_SITE_ABSENT_REQUIRES_REVIEW"))
                throw new AssertionError("Out-of-range base ordinal was silently accepted");
            var overload = new MethodNode(1, "work", "(J)V", null, null);
            overload.instructions.add(new MethodInsnNode(184, "fixture/API", "call", "()V", false));
            base.methods.add(overload);
            if (!audit.sites(child.name, "work", injection).getFirst().get("status").equals("BASE_SITE_ABSENT_REQUIRES_REVIEW"))
                throw new AssertionError("Occurrences across overloads incorrectly satisfied one-method ordinal");
            var literal = new IntInsnNode(16, 50);
            base.methods.getFirst().instructions.add(literal);
            var constant = new AnnotationNode("Lorg/spongepowered/asm/mixin/injection/Constant;");
            constant.values = new ArrayList<>(List.of("intValue", 50));
            var constantInjection = new AnnotationNode("Lorg/spongepowered/asm/mixin/injection/ModifyConstant;");
            constantInjection.values = new ArrayList<>(List.of("constant", List.of(constant)));
            if (!audit.constants(child.name, "work(I)V", constantInjection).getFirst().get("status").equals("BASE_SITE_PRESENT"))
                throw new AssertionError("Exact constant was missed");
            literal.operand = 51;
            if (!audit.constants(child.name, "work(I)V", constantInjection).getFirst().get("status").equals("BASE_SITE_ABSENT_REQUIRES_REVIEW"))
                throw new AssertionError("Changed constant was silently accepted");
            var floatLiteral = new InsnNode(11); // FCONST_0
            base.methods.getFirst().instructions.add(floatLiteral);
            constant.values = new ArrayList<>(List.of("floatValue", 0.0F));
            if (!audit.constants(child.name, "work(I)V", constantInjection).getFirst().get("status").equals("BASE_SITE_PRESENT"))
                throw new AssertionError("Exact FCONST float was missed");
            var loadedFloat = new LdcInsnNode(0.0F);
            base.methods.getFirst().instructions.set(floatLiteral, loadedFloat);
            if (!audit.constants(child.name, "work(I)V", constantInjection).getFirst().get("status").equals("BASE_SITE_PRESENT"))
                throw new AssertionError("Exact LDC float was missed");
            loadedFloat.cst = 1.0F;
            if (!audit.constants(child.name, "work(I)V", constantInjection).getFirst().get("status").equals("BASE_SITE_ABSENT_REQUIRES_REVIEW"))
                throw new AssertionError("Changed float was silently accepted");
            loadedFloat.cst = 0.0D;
            if (!audit.constants(child.name, "work(I)V", constantInjection).getFirst().get("status").equals("BASE_SITE_ABSENT_REQUIRES_REVIEW"))
                throw new AssertionError("Double incorrectly matched float selector");
            loadedFloat.cst = 0.0F;
            constant.values.addAll(List.of("ordinal", 1));
            overload.instructions.add(new LdcInsnNode(0.0F));
            if (!audit.constants(child.name, "work", constantInjection).getFirst().get("status").equals("BASE_SITE_ABSENT_REQUIRES_REVIEW"))
                throw new AssertionError("Constants across overloads incorrectly satisfied one-method ordinal");
            audit.cache.put(child.name, null);
            if (audit.methodExists(child.name, "work(I)V", new HashSet<>()))
                throw new AssertionError("Absent target was silently accepted");
            System.out.println("PASS: exact inherited members/sites and int/float constants; descriptor, member, target, renamed site, changed value/type and ordinal failures rejected");
            return;
        }
        if (args.length != 3) throw new IllegalArgumentException("Expected Core, provider list, report path");
        var audit = new CoreMixinBindingAudit();
        try {
            audit.providers.add(new ZipFile(args[0]));
            String[] paths = JSON.fromJson(Files.readString(Path.of(args[1])), String[].class);
            for (String path : paths) if (!path.equals(args[0])) audit.providers.add(new ZipFile(path));
            JsonObject config;
            try (var core = new ZipFile(args[0]); var stream = core.getInputStream(core.getEntry("createch2core.mixins.json"))) {
                config = JSON.fromJson(new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8), JsonObject.class);
            }
            var rows = new ArrayList<Map<String, Object>>();
            String prefix = config.get("package").getAsString().replace('.', '/');
            for (String group : List.of("mixins", "client", "server")) {
                if (!config.has(group)) continue;
                for (var entry : config.getAsJsonArray(group)) rows.add(audit.audit(prefix + "/" + entry.getAsString().replace('.', '/')));
            }
            Files.writeString(Path.of(args[2]), JSON.toJson(Map.of("truth", "STATIC_BASE_CLASS_AND_METHOD_SELECTOR_AUDIT",
                "mixins", rows, "limits", List.of("Base classfiles only; mixin-introduced/loader-patched methods require explicit classification.",
                "Literal sites/constants and minimum base ordinal range only; constructor pairing, assignment/local capture, slices, shifts, transformer ordering and effective runtime matches remain unproven.",
                "No Minecraft class initialized or graphics context launched."))));
            System.out.println("Audited " + rows.size() + " configured mixin classfiles");
        } finally {
            for (var provider : audit.providers) provider.close();
        }
    }
}
