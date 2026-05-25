package com.bachatkaro.smsengine.smstransactionengine.util;

import android.content.Context;
import android.util.Log;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * SmsEngineLogger
 * ───────────────
 * Thread-safe static utility for dual-channel logging (Logcat + File).
 * Fixed: "non-static method cannot be referenced from a static context"
 * 
 * Performance: Uses persistent BufferedWriter to avoid syscall overhead.
 * Security: Automatically sanitizes sensitive data (OTP, Emails).
 */
public class SmsEngineLogger {

    private static final String MASTER_TAG = "SmsEngine";
    private static final String LOG_DIR = "sms_engine_logs";
    private static final String LOG_FILE = "engine.log";
    private static final String LOG_FILE_BAK = "engine.log.bak";
    private static final long MAX_FILE_SIZE_BYTES = 2L * 1024L * 1024L; // 2 MB

    private static final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS", Locale.US);

    private static File logFile = null;
    private static BufferedWriter writer = null;
    private static long bytesWritten = 0L;
    private static boolean initialized = false;

    private static final Pattern REDACT_NUMBERS = Pattern.compile("\\b\\d{6,}\\b");
    private static final Pattern REDACT_EMAIL = Pattern.compile("([A-Za-z0-9._%+-]{2})[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+)");

    /**
     * Initialise the file logger. Must be called once at app start.
     */
    public synchronized static void init(Context context) {
        if (initialized) return;
        try {
            File dir = new File(context.getApplicationContext().getFilesDir(), LOG_DIR);
            if (!dir.exists()) dir.mkdirs();
            File file = new File(dir, LOG_FILE);
            logFile = file;
            bytesWritten = file.exists() ? file.length() : 0L;
            writer = openWriter(file);
            initialized = true;
            
            String banner = timestamp() + " [I] [Logger] SmsEngineLogger initialised. path=" + file.getAbsolutePath() + "\n";
            writer.write(banner);
            writer.flush();
            bytesWritten += banner.length();
        } catch (Exception ex) {
            Log.e(MASTER_TAG, "Logger init failed: " + ex.getMessage(), ex);
        }
    }

    public static void d(String tag, String message) {
        write(Level.DEBUG, tag, message, null);
    }

    public static void i(String tag, String message) {
        write(Level.INFO, tag, message, null);
    }

    public static void w(String tag, String message) {
        write(Level.WARN, tag, message, null);
    }

    public static void w(String tag, String message, Throwable t) {
        write(Level.WARN, tag, message, t);
    }

    public static void e(String tag, String message) {
        write(Level.ERROR, tag, message, null);
    }

    public static void e(String tag, String message, Throwable t) {
        write(Level.ERROR, tag, message, t);
    }

    private synchronized static void write(Level level, String tag, String message, Throwable t) {
        String safeMessage = sanitize(message);
        String fullTag = MASTER_TAG + "/" + tag;

        // 1. Logcat
        switch (level) {
            case DEBUG: Log.d(fullTag, safeMessage, t); break;
            case INFO:  Log.i(fullTag, safeMessage, t); break;
            case WARN:  Log.w(fullTag, safeMessage, t); break;
            case ERROR: Log.e(fullTag, safeMessage, t); break;
        }

        // 2. File output
        if (logFile == null) return;

        try {
            StringBuilder sb = new StringBuilder();
            sb.append(timestamp()).append(" [").append(level.label).append("] [").append(tag).append("] ").append(safeMessage);
            if (t != null) {
                sb.append("\n    ").append(t.getClass().getSimpleName()).append(": ").append(sanitize(t.getMessage()));
            }
            sb.append("\n");
            String line = sb.toString();

            if (bytesWritten >= MAX_FILE_SIZE_BYTES) {
                rotate(logFile);
            }

            if (writer == null) writer = openWriter(logFile);
            writer.write(line);
            writer.flush();
            bytesWritten += line.length();
        } catch (Exception ignored) {}
    }

    private static void rotate(File file) {
        try {
            closeWriter();
            File bak = new File(file.getParent(), LOG_FILE_BAK);
            if (bak.exists()) bak.delete();
            file.renameTo(bak);
            writer = openWriter(file);
            bytesWritten = 0L;
            String msg = timestamp() + " [I] [Logger] Log rotated\n";
            writer.write(msg);
            writer.flush();
            bytesWritten += msg.length();
        } catch (Exception ignored) {}
    }

    private static BufferedWriter openWriter(File file) throws Exception {
        return new BufferedWriter(new FileWriter(file, true), 8192);
    }

    private static void closeWriter() {
        try { if (writer != null) writer.close(); } catch (Exception ignored) {}
        writer = null;
    }

    private static String timestamp() {
        return dateFormat.format(new Date());
    }

    private static String sanitize(String input) {
        if (input == null || input.isEmpty()) return "";
        String out = REDACT_NUMBERS.matcher(input).replaceAll("[redacted]");
        out = REDACT_EMAIL.matcher(out).replaceAll("$1***@$2");
        return out;
    }

    public synchronized static String readLog() {
        if (logFile == null || !logFile.exists()) return "Log file not initialised.";
        try {
            if (writer != null) writer.flush();
            StringBuilder content = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new FileReader(logFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    content.append(line).append("\n");
                }
            }
            return content.toString();
        } catch (Exception ex) {
            return "Error reading log: " + ex.getMessage();
        }
    }

    public synchronized static void clearLog() {
        try {
            closeWriter();
            if (logFile != null) {
                new FileWriter(logFile, false).close();
                writer = openWriter(logFile);
            }
            bytesWritten = 0L;
        } catch (Exception ignored) {}
    }

    private enum Level {
        DEBUG("D"), INFO("I"), WARN("W"), ERROR("E");
        final String label;
        Level(String label) { this.label = label; }
    }
}
