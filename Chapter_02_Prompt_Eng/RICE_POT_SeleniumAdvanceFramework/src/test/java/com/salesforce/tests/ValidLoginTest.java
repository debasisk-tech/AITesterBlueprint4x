package com.salesforce.tests;

import org.testng.Assert;
import org.testng.annotations.Test;

import com.salesforce.base.BaseTest;

public class ValidLoginTest extends BaseTest {

    @Test(priority = 1, description = "Verify the login page UI elements are displayed")
    public void loginPageUiElementsDisplayed() {
        try {
            Assert.assertTrue(loginPage.areLoginFieldsDisplayed(),
                    "Username, password and login button should be displayed");
            Assert.assertTrue(loginPage.isRememberMeDisplayed(),
                    "The remember me checkbox should be displayed");
        } catch (AssertionError assertionError) {
            throw assertionError;
        } catch (Exception exception) {
            throw new RuntimeException("UI element verification failed. " + exception.getMessage(), exception);
        }
    }

    @Test(priority = 2, description = "Verify the remember me checkbox can be selected")
    public void rememberMeCanBeSelected() {
        try {
            loginPage.clickRememberMe();
            Assert.assertTrue(loginPage.isRememberMeSelected(),
                    "The remember me checkbox should be selected after clicking it");
        } catch (AssertionError assertionError) {
            throw assertionError;
        } catch (Exception exception) {
            throw new RuntimeException("Remember me verification failed. " + exception.getMessage(), exception);
        }
    }

    @Test(priority = 3, description = "Verify a valid user is navigated away from the login page")
    public void validLoginNavigatesHome() {
        try {
            loginPage.doLogin(config.get("valid.username"), config.get("valid.password"));
            String currentUrl = loginPage.getCurrentUrl();
            Assert.assertTrue(waitUtils.waitForUrlContains("lightning", config.getInt("explicit.wait"))
                            || waitUtils.waitForUrlContains("home", config.getInt("explicit.wait")),
                    "Valid credentials should navigate to the Salesforce home, actual URL: " + currentUrl);
        } catch (AssertionError assertionError) {
            throw assertionError;
        } catch (Exception exception) {
            throw new RuntimeException("Valid login flow failed. " + exception.getMessage(), exception);
        }
    }
}
