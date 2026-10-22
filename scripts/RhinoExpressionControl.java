import dev.latvian.mods.rhino.ContextFactory;
import dev.latvian.mods.rhino.EvaluatorException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Execute isolated supplied expressions with installed Rhino, outside Minecraft. */
public final class RhinoExpressionControl {
    public static void main(String[] args) throws Exception {
        var context = new ContextFactory().enter();
        if (args.length < 2) throw new IllegalArgumentException("Provide failing control followed by repaired expressions");
        boolean rejected = false;
        try {
            context.evaluateString(context.initStandardObjects(), Files.readString(Path.of(args[0])), args[0], 1, null);
        } catch (EvaluatorException expected) {
            if (!expected.getMessage().contains("Too complex regexp")) throw expected;
            rejected = true;
        }
        if (!rejected) throw new AssertionError("Native regexp limit was not reproduced");
        for (int i = 1; i < args.length; i++) {
            String file = args[i];
            context.evaluateString(context.initStandardObjects(), Files.readString(Path.of(file)), file, 1, null);
        }
        System.out.println("PASS: old regexp rejected; " + (args.length - 1) + " repaired expressions executed with installed Rhino");
    }
}
