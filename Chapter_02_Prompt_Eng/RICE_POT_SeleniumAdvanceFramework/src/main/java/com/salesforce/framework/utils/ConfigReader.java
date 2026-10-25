package com.salesforce.framework.utils;

import java.io.InputStream;
import java.util.Properties;

public final class ConfigReader {

    private static final String CONFIG_FILE = "config.properties";

    private static volatile ConfigReader instance;

    private final Properties properties;

    private ConfigReader() {
        properties = new Properties();
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(CONFIG_FILE)) {
            if (inputStream == null) {
                throw new IllegalArgumentException("Configuration file not found on classpath: " + CONFIG_FILE);
            }
            properties.load(inputStream);
        } catch (Exception exception) {
            throw new RuntimeException("Failed to load configuration file: " + CONFIG_FILE, exception);
        }
    }

    public static ConfigReader getInstance() {
        if (instance == null) {
            synchronized (ConfigReader.class) {
                if (instance == null) {
                    instance = new ConfigReader();
                }
            }
        }
        return instance;
    }

    public String get(String key) {
        String value = properties.getProperty(key);
        if (value == null || value.trim().isEmpty()) {
            throw new RuntimeException("Missing or empty configuration key: " + key);
        }
        return value.trim();
    }

    public int getInt(String key) {
        try {
            return Integer.parseInt(get(key));
        } catch (NumberFormatException exception) {
            throw new RuntimeException("Configuration key is not a valid integer: " + key, exception);
        }
    }

    public boolean getBoolean(String key) {
        return Boolean.parseBoolean(get(key));
    }
}
