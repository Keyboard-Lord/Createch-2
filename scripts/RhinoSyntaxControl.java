import dev.latvian.mods.rhino.ContextFactory;
import dev.latvian.mods.rhino.EvaluatorException;
import dev.latvian.mods.rhino.Parser;
import java.nio.file.Files;
import java.nio.file.Path;

/** Parse only, using the exact Rhino installed with the pack. No script execution. */
public final class RhinoSyntaxControl {
    public static void main(String[] args) throws Exception {
        var context = new ContextFactory().enter();
        boolean rejected = false;
        try {
            new Parser(context).parse("ServerEvents.recipes(e => { var stationId = 'a'; var stationId = 'b'; });", "observed-redeclaration", 1);
        } catch (EvaluatorException expected) {
            rejected = true;
        }
        if (!rejected) throw new AssertionError("Native parser did not reproduce the observed duplicate-var failure");
        for (String file : args) new Parser(context).parse(Files.readString(Path.of(file)), file, 1);
        System.out.println("PASS: " + args.length + " scripts parsed with installed Rhino; duplicate-var negative reproduced");
    }
}
