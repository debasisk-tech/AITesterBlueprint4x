package com.salesforce.framework.pages;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;

import com.salesforce.framework.utils.WaitUtils;

public class LoginPage {

    private static final int ERROR_WAIT_SECONDS = 15;

    private final WebDriver driver;

    private final WaitUtils waitUtils;

    @FindBy(xpath = "//input[@id='username']")
    private WebElement usernameField;

    @FindBy(xpath = "//input[@id='password']")
    private WebElement passwordField;

    @FindBy(xpath = "//input[@id='Login']")
    private WebElement loginButton;

    @FindBy(xpath = "//input[@id='rememberUn']")
    private WebElement rememberMeCheckBox;

    @FindBy(xpath = "//div[@id='error']")
    private WebElement errorMessage;

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        this.waitUtils = new WaitUtils(driver);
        PageFactory.initElements(driver, this);
    }

    public void enterUsername(String username) {
        try {
            waitUtils.waitForVisibility(usernameField).clear();
            waitUtils.waitForVisibility(usernameField).sendKeys(username);
        } catch (Exception exception) {
            throw new RuntimeException("Unable to enter the username. " + exception.getMessage(), exception);
        }
    }

    public void enterPassword(String password) {
        try {
            waitUtils.waitForVisibility(passwordField).clear();
            waitUtils.waitForVisibility(passwordField).sendKeys(password);
        } catch (Exception exception) {
            throw new RuntimeException("Unable to enter the password. " + exception.getMessage(), exception);
        }
    }

    public void clickLogin() {
        try {
            waitUtils.waitForClickable(loginButton).click();
        } catch (Exception exception) {
            throw new RuntimeException("Unable to click the login button. " + exception.getMessage(), exception);
        }
    }

    public void clickRememberMe() {
        try {
            waitUtils.waitForClickable(rememberMeCheckBox).click();
        } catch (Exception exception) {
            throw new RuntimeException("Unable to click the remember me checkbox. " + exception.getMessage(), exception);
        }
    }

    public void doLogin(String username, String password) {
        try {
            enterUsername(username);
            enterPassword(password);
            clickLogin();
        } catch (Exception exception) {
            throw new RuntimeException("Login attempt failed. " + exception.getMessage(), exception);
        }
    }

    public boolean areLoginFieldsDisplayed() {
        try {
            return waitUtils.waitForVisibility(usernameField).isDisplayed()
                    && waitUtils.waitForVisibility(passwordField).isDisplayed()
                    && waitUtils.waitForVisibility(loginButton).isDisplayed();
        } catch (Exception exception) {
            throw new RuntimeException("Login fields are not displayed. " + exception.getMessage(), exception);
        }
    }

    public boolean isRememberMeDisplayed() {
        try {
            return waitUtils.waitForVisibility(rememberMeCheckBox).isDisplayed();
        } catch (Exception exception) {
            throw new RuntimeException("The remember me checkbox is not displayed. " + exception.getMessage(), exception);
        }
    }

    public boolean isRememberMeSelected() {
        try {
            return waitUtils.waitForVisibility(rememberMeCheckBox).isSelected();
        } catch (Exception exception) {
            throw new RuntimeException("Unable to read the remember me state. " + exception.getMessage(), exception);
        }
    }

    public boolean isErrorMessageDisplayed() {
        try {
            return waitUtils.isElementDisplayed(errorMessage, ERROR_WAIT_SECONDS);
        } catch (Exception exception) {
            throw new RuntimeException("Unable to determine the error message state. " + exception.getMessage(), exception);
        }
    }

    public String getErrorMessageText() {
        try {
            return waitUtils.waitForVisibility(errorMessage).getText().trim();
        } catch (Exception exception) {
            throw new RuntimeException("Unable to read the error message. " + exception.getMessage(), exception);
        }
    }

    public String getCurrentUrl() {
        try {
            return driver.getCurrentUrl();
        } catch (Exception exception) {
            throw new RuntimeException("Unable to read the current URL. " + exception.getMessage(), exception);
        }
    }

    public String getPageTitle() {
        try {
            return driver.getTitle();
        } catch (Exception exception) {
            throw new RuntimeException("Unable to read the page title. " + exception.getMessage(), exception);
        }
    }
}
