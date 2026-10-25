package com.salesforce.framework.utils;

import java.time.Duration;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class WaitUtils {

    private static final int DEFAULT_TIMEOUT_SECONDS = 20;

    private final WebDriver driver;

    public WaitUtils(WebDriver driver) {
        this.driver = driver;
    }

    public WebElement waitForVisibility(WebElement element) {
        return waitForVisibility(element, DEFAULT_TIMEOUT_SECONDS);
    }

    public WebElement waitForVisibility(WebElement element, int timeoutSeconds) {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                    .until(ExpectedConditions.visibilityOf(element));
        } catch (Exception exception) {
            throw new RuntimeException("Element was not visible within " + timeoutSeconds + " seconds", exception);
        }
    }

    public WebElement waitForClickable(WebElement element) {
        return waitForClickable(element, DEFAULT_TIMEOUT_SECONDS);
    }

    public WebElement waitForClickable(WebElement element, int timeoutSeconds) {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                    .until(ExpectedConditions.elementToBeClickable(element));
        } catch (Exception exception) {
            throw new RuntimeException("Element was not clickable within " + timeoutSeconds + " seconds", exception);
        }
    }

    public boolean isElementDisplayed(WebElement element, int timeoutSeconds) {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                    .until(ExpectedConditions.visibilityOf(element)).isDisplayed();
        } catch (Exception exception) {
            return false;
        }
    }

    public boolean waitForUrlContains(String urlFragment, int timeoutSeconds) {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                    .until(ExpectedConditions.urlContains(urlFragment));
        } catch (Exception exception) {
            return false;
        }
    }
}
