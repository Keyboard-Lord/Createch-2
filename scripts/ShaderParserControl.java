import io.github.ocelot.glslprocessor.api.GlslParser;
import java.nio.file.Files;
import java.nio.file.Path;

/** Installed-parser regression control; no Minecraft client or graphics context. */
public final class ShaderParserControl {
    private static void serialize(String source) throws Exception {
        var tree = GlslParser.parse(source);
        // Veil's AST writer/transformations use function nodes as map keys.
        tree.functions().forEach(function -> function.hashCode());
        if (tree.toSourceString().isBlank()) throw new AssertionError("Empty shader source");
    }

    public static void main(String[] args) throws Exception {
        if (args.length > 1 && args[0].equals("--accept-native")) {
            for (int i = 1; i < args.length; i++) {
                serialize(Files.readString(Path.of(args[i])));
                System.out.println(args[i] + " PASS_NATIVE_SOURCE_SERIALIZATION");
            }
            return;
        }
        if (args.length == 0 || args.length % 4 != 0) throw new IllegalArgumentException("Expected control quadruples");
        for (int i = 0; i < args.length; i += 4) {
            boolean reproduced = false;
            try {
                serialize(Files.readString(Path.of(args[i])));
            } catch (NullPointerException observed) {
                if (observed.getMessage() == null || !observed.getMessage().contains(args[i + 2])) throw observed;
                reproduced = true;
            }
            if (!reproduced) throw new AssertionError("Native failure no longer reproduced: " + args[i + 3]);
            serialize(Files.readString(Path.of(args[i + 1])));
            System.out.println(args[i + 3] + " PASS_NATIVE_CONTROL_AND_REVISED_SERIALIZATION");
        }
    }
}
