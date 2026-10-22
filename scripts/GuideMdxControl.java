import guideme.libs.mdast.MdAst;
import guideme.libs.mdast.MdastOptions;
import guideme.libs.mdast.YamlFrontmatterExtension;
import guideme.libs.mdast.gfm.GfmTableMdastExtension;
import guideme.libs.mdast.gfmstrikethrough.GfmStrikethroughMdastExtension;
import guideme.libs.mdast.mdx.MdxMdastExtension;
import guideme.libs.mdx.MdxSyntax;
import guideme.libs.micromark.ParseException;
import guideme.libs.micromark.extensions.YamlFrontmatterSyntax;
import guideme.libs.micromark.extensions.gfm.GfmTableSyntax;
import guideme.libs.micromark.extensions.gfmstrikethrough.GfmStrikethroughSyntax;
import java.nio.file.Files;
import java.nio.file.Path;

/** Uses the installed GuideME PageCompiler parser options without booting Minecraft. */
public final class GuideMdxControl {
    private static MdastOptions options() {
        return new MdastOptions()
            .withSyntaxExtension(MdxSyntax.INSTANCE)
            .withSyntaxExtension(YamlFrontmatterSyntax.INSTANCE)
            .withSyntaxExtension(GfmTableSyntax.INSTANCE)
            .withSyntaxExtension(GfmStrikethroughSyntax.INSTANCE)
            .withMdastExtension(MdxMdastExtension.INSTANCE)
            .withMdastExtension(YamlFrontmatterExtension.INSTANCE)
            .withMdastExtension(GfmTableMdastExtension.INSTANCE)
            .withMdastExtension(GfmStrikethroughMdastExtension.INSTANCE);
    }

    public static void main(String[] args) throws Exception {
        boolean rejected = false;
        try {
            MdAst.fromMarkdown("<!-- campaign-unity -->\n# Visible guide\n", options());
        } catch (ParseException expected) {
            rejected = true;
        }
        if (!rejected) throw new AssertionError("Installed parser no longer reproduces the observed HTML-marker failure");
        for (String file : args) MdAst.fromMarkdown(Files.readString(Path.of(file)), options());
        System.out.println("PASS: " + args.length + " guides parse with native GuideME options; observed HTML-marker negative reproduced");
    }
}
