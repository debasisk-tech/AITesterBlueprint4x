package com.salesforce.tests;

import org.testng.Assert;
import org.testng.annotations.Test;

import com.salesforce.base.BaseTest;

public class InvalidLoginTest extends BaseTest {

    @Test(priority = 1, description = "Verify an error is shown for a valid username with a wrong password")
    public void invalidPasswordShowsError() {
        assertLoginError(config.get("valid.username"), "WrongPassword@123");
    }

    @Test(priority = 2, description = "Verify an error is shown when the username is empty")
    public void emptyUsernameShowsError() {
        assertLoginError("", config.get("invalid.password"));
    }

    @Test(priority = 3, description = "Verify an error is shown when the password is empty")
    public void emptyPasswordShowsError() {
        assertLoginError(config.get("invalid.username"), "");
    }

    @Test(priority = 4, description = "Verify an error is shown when both fields are empty")
    public void emptyCredentialsShowsError() {
        assertLoginError("", "");
    }

    @Test(priority = 5, description = "Verify an error is shown for a malformed username")
    public void invalidUsernameFormatShowsError() {
        assertLoginError("not-a-valid-user", "SomePassword@123");
    }

    private void assertLoginError(String username, String password) {
        try {
            loginPage.doLogin(username, password);
            Assert.assertTrue(loginPage.isErrorMessageDisplayed(),
                    "An error message should be displayed for credentials: [" + username + "] / [" + password + "]");
            Assert.assertFalse(loginPage.getErrorMessageText().isEmpty(),
                    "The login error message should not be empty");
        } catch (AssertionError assertionError) {
            throw assertionError;
        } catch (Exception exception) {
            throw new RuntimeException("Invalid login verification failed for username: [" + username + "]. "
                    + exception.getMessage(), exception);
        }
    }
}
