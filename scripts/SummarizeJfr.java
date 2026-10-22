import java.nio.file.Path;
import java.util.*;
import jdk.jfr.consumer.*;

/** Streams the recording; avoids expanding stack traces into a huge JSON dump. */
class SummarizeJfr {
    static final String BRIDGE = "createch2.core.compat.client.FtbQuestEmiBridge";
    static final class Stats {
        long samples, renderSamples, bridgeSamples, allocatedWeight, bridgeAllocatedWeight;
        long questVisibilitySamples, truncatedQuestVisibilitySamples;
        final Map<String, Long> leaves = new HashMap<>();
        final Map<String, Long> threads = new HashMap<>();
        final Map<String, Long> applicationFrames = new HashMap<>();
    }
    static String phase(long at, long[] boundaries) {
        if (at < boundaries[0] || at >= boundaries[4]) return null;
        if (at < boundaries[1]) return "warmup";
        if (at < boundaries[2]) return "stationary";
        if (at < boundaries[3]) return "new_chunks";
        return "settle";
    }
    static String quote(String value) { return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""; }
    static String top(Map<String, Long> values, int limit) {
        return values.entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed()
            .thenComparing(Map.Entry.comparingByKey())).limit(limit)
            .map(e -> quote(e.getKey()) + ":" + e.getValue()).reduce((a, b) -> a + "," + b).map(s -> "{" + s + "}").orElse("{}");
    }
    public static void main(String[] args) throws Exception {
        long started = Long.parseLong(args[1]);
        long[] boundaries = {started, started + 120000, started + 180000, started + 270000, started + 300000};
        if (args.length == 6) for (int i = 0; i < 5; i++) boundaries[i] = Long.parseLong(args[i + 1]);
        Map<String, Stats> phases = new LinkedHashMap<>();
        for (String name : List.of("warmup", "stationary", "new_chunks", "settle")) phases.put(name, new Stats());
        try (RecordingFile recording = new RecordingFile(Path.of(args[0]))) {
            while (recording.hasMoreEvents()) {
                RecordedEvent event = recording.readEvent();
                String type = event.getEventType().getName();
                if (!type.equals("jdk.ExecutionSample") && !type.equals("jdk.ObjectAllocationSample")) continue;
                String name = phase(event.getStartTime().toEpochMilli(), boundaries);
                if (name == null) continue;
                Stats stats = phases.get(name);
                RecordedStackTrace stack = event.getStackTrace();
                boolean bridge = stack != null && stack.getFrames().stream().anyMatch(f ->
                    f.getMethod().getType().getName().equals(BRIDGE) && f.getMethod().getName().equals("onTick"));
                if (type.equals("jdk.ObjectAllocationSample")) {
                    long weight = event.getLong("weight");
                    stats.allocatedWeight += weight;
                    if (bridge) stats.bridgeAllocatedWeight += weight;
                } else {
                    stats.samples++;
                    boolean questVisibility = stack != null && stack.getFrames().stream().anyMatch(f ->
                        f.getMethod().getType().getName().equals("dev.ftb.mods.ftbquests.quest.Quest") && f.getMethod().getName().equals("isVisible"));
                    if (questVisibility) {
                        stats.questVisibilitySamples++;
                        if (stack.isTruncated()) stats.truncatedQuestVisibilitySamples++;
                    }
                    RecordedThread thread = event.getThread("sampledThread");
                    String threadName = thread == null ? "unknown" : thread.getJavaName();
                    stats.threads.merge(threadName, 1L, Long::sum);
                    // JFR may retain the initial "main" name after Minecraft
                    // renames this client thread to "Render thread".
                    if ("Render thread".equals(threadName) || "main".equals(threadName)) stats.renderSamples++;
                    if (bridge) stats.bridgeSamples++;
                    if (stack != null && !stack.getFrames().isEmpty()) {
                        RecordedMethod method = stack.getFrames().getFirst().getMethod();
                        stats.leaves.merge(method.getType().getName() + "." + method.getName(), 1L, Long::sum);
                        Set<String> seen = new HashSet<>();
                        for (RecordedFrame frame : stack.getFrames()) {
                            String typeName = frame.getMethod().getType().getName();
                            if (typeName.startsWith("java.") || typeName.startsWith("jdk.") || typeName.startsWith("sun.")
                                || typeName.startsWith("net.minecraft.") || typeName.startsWith("com.mojang.")
                                || typeName.startsWith("it.unimi.") || typeName.startsWith("org.lwjgl.")
                                || typeName.startsWith("cpw.mods.") || typeName.startsWith("net.neoforged.fml.loading.")
                                || typeName.startsWith("net.neoforged.bus.")) continue;
                            String key = typeName + "." + frame.getMethod().getName();
                            if (seen.add(key)) stats.applicationFrames.merge(key, 1L, Long::sum);
                        }
                    }
                }
            }
        }
        List<String> result = new ArrayList<>();
        for (var entry : phases.entrySet()) {
            Stats s = entry.getValue();
            result.add(quote(entry.getKey()) + ":{\"executionSamples\":" + s.samples + ",\"mainOrRenderThreadSamples\":" + s.renderSamples
                + ",\"ftbBridgeStackSamples\":" + s.bridgeSamples + ",\"allocationSampleWeightBytes\":" + s.allocatedWeight
                + ",\"questVisibilityStackSamples\":" + s.questVisibilitySamples + ",\"truncatedQuestVisibilityStackSamples\":" + s.truncatedQuestVisibilitySamples
                + ",\"ftbBridgeAllocationSampleWeightBytes\":" + s.bridgeAllocatedWeight
                + ",\"topLeafMethods\":" + top(s.leaves, 12) + ",\"inclusiveApplicationFrames\":" + top(s.applicationFrames, 20)
                + ",\"sampledThreads\":" + top(s.threads, 12) + "}");
        }
        System.out.println("{" + String.join(",", result) + "}");
    }
}
