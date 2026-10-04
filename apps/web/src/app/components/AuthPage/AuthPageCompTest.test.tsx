// React must be in scope because we write JSX (<AuthPageComp />) in this file
import React from "react";
// render = mount component in fake DOM, screen = query the DOM, waitFor = retry an assertion until it passes, within = search inside one element only
import { render, screen, waitFor, within } from "@testing-library/react";
// userEvent simulates REAL user behavior (mousedown -> mouseup -> click, typing key by key), unlike fireEvent which fires one raw event
import userEvent from "@testing-library/user-event";
// We import axios only to grab its (mocked) functions so we can control and inspect them
import axios from "axios";
// Same idea: import the mocked signIn so we can say "return this" and "was it called with that?"
import { signIn } from "next-auth/react";
// The mocked toast, so we can assert which messages the component tried to show
import { toast } from "sonner";
// The mocked logger, so we can assert that errors were logged
import { clientLogger } from "@/utils/clientLogger/clientLogger";
// The mocked hook, so each test can decide what username status (idle/checking/available/taken) it returns
import { useUsernameAvailability } from "@/hooks/userUsernameAvailability";
// The component under test (adjust this path/name to your real file)
import  {AuthPageComp}  from "./AuthPage";
 
/* ------------------------------------------------------------------ */
/* MOCKS: replace everything the component talks to that isn't its own */
/* logic. jest.mock() calls are hoisted (moved to the top) by Babel,   */
/* so they run BEFORE the imports above -> the component gets fakes.   */
/* ------------------------------------------------------------------ */
 
// Variables used inside a jest.mock factory MUST start with "mock" (Jest's hoisting safety rule)
const mockReplace = jest.fn();
// Fake next/navigation so useRouter() works outside a real Next.js app
jest.mock("next/navigation", () => ({
    // useRouter returns an object with only the method the component uses: replace
    useRouter: () => ({ replace: mockReplace }),
}));
 
// Fake next-auth/react: signIn becomes a spy (jest.fn) we can control per test
jest.mock("next-auth/react", () => ({ signIn: jest.fn() }));
// Fake sonner: toast.success and toast.error become spies, no real toasts render
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
// Fake axios so no real HTTP request ever leaves the test
jest.mock("axios", () => ({
    // Tells Jest this object behaves like an ES module (so `import axios from` works)
    __esModule: true,
    // The component uses axios.post and axios.isAxiosError, so those are the only two we fake
    default: { post: jest.fn(), isAxiosError: jest.fn() },
}));
 
// Fake the Zustand auth store: the component only destructures setAuthUser (it never calls it)
jest.mock("@/lib/store/usersStore/useAuthStore", () => ({
    useAuthStore: () => ({ setAuthUser: jest.fn() }),
}));
// Fake logger with just an error() spy
jest.mock("@/utils/logger/clientLogger", () => ({ clientLogger: { error: jest.fn() } }));
// Fake the username hook: it would normally debounce + call an API, which we don't want here
jest.mock("@/hooks/userUsernameAvailability", () => ({ useUsernameAvailability: jest.fn() }));
 
// Fake validators so we don't depend on their real rules
jest.mock("@/utils/phoneValidators", () => ({
    // Phone verification is disabled in the component, so always "invalid" is fine
    validatePhoneNumber: () => false,
    // Simple email check: something@something.something
    validateEmail: (email: string) => /\S+@\S+\.\S+/.test(email),
}));
 
// Permissive schemas: we test the COMPONENT's flow here, not your validation rules
jest.mock("@/utils/fieldsValidation/Auth/ZodAuthSchema", () => {
    // Inside a factory we must require() zod (top-level imports aren't available yet because of hoisting)
    const { z } = require("zod");
    // Return replacements for both schemas the component imports
    return {
        // Login: accept any two strings
        loginSchema: z.object({ email: z.string(), password: z.string() }),
        // Signup: accept any strings, and a number for phoneNumber (its default value is 0)
        signUpSchema: z.object({
            // Any string is fine for name
            name: z.string(),
            // Any string is fine for email
            email: z.string(),
            // Any string is fine for username
            username: z.string(),
            // Any string is fine for password
            password: z.string(),
            // Any string is fine for confirmPassword (the component checks the match itself)
            confirmPassword: z.string(),
            // Role defaults to "USER"
            role: z.string(),
            // profileImage defaults to "" (empty string)
            profileImage: z.string(),
            // phoneNumber defaults to the number 0
            phoneNumber: z.number(),
        }),
    };
});
 
// Replace motion (animation library) with plain divs, because animation is irrelevant to behavior
jest.mock("motion/react", () => {
    // require React inside the factory for the same hoisting reason as zod above
    const React = require("react");
    // Return a fake `motion` object
    return {
        motion: {
            // Fake motion.div: strip animation-only props so React doesn't warn about unknown DOM attributes
            div: ({ children, whileTap, transition, ...rest }: any) =>
                // Render a normal div with the remaining props and the children
                React.createElement("div", rest, children),
        },
    };
});
 
// Replace the image uploader: it has its own logic (file picking, upload) that isn't this component's job
jest.mock("../ProfileImageUpload", () => {
    // require React inside the factory (hoisting rule again)
    const React = require("react");
    // Return the module shape: a default export
    return {
        // Mark as ES module so `import ProfileImageUpload from` resolves to `default`
        __esModule: true,
        // A stub component: just an empty div with a test id
        default: () => React.createElement("div", { "data-testid": "profile-image-upload" }),
    };
});
 
// Replace the OTP widgets with tiny fakes so WE trigger the callbacks the component passes down
jest.mock("../UserVerificationForm", () => {
    // require React inside the factory (hoisting rule again)
    const React = require("react");
    // Return both named exports the component imports
    return {
        // Fake sender: one button that calls onOtpSent when clicked (simulates "OTP was sent")
        EmailOtpSender: ({ onOtpSent }: any) =>
            React.createElement("button", { type: "button", onClick: onOtpSent }, "Send Email OTP"),
        // Fake verifier: two buttons wrapped in a div
        EmailOtpVerifier: ({ onVerified, onChangeEmail }: any) =>
            React.createElement(
                "div",
                null,
                // Clicking this simulates "user entered the correct OTP"
                React.createElement("button", { type: "button", onClick: onVerified }, "Verify Email OTP"),
                // Clicking this simulates "user wants to use a different email"
                React.createElement("button", { type: "button", onClick: onChangeEmail }, "Change Email")
            ),
    };
});
 
/* ------------------------------------------------------------------ */
/* TYPED HANDLES + HELPERS                                             */
/* ------------------------------------------------------------------ */
 
// Tell TypeScript signIn is a Jest mock so we can call .mockResolvedValue etc. on it
const mockedSignIn = signIn as jest.Mock;
// Same for axios.post
const mockedPost = axios.post as jest.Mock;
// axios.isAxiosError is a type guard, so TS needs `unknown` in the middle before casting to jest.Mock
const mockedIsAxiosError = axios.isAxiosError as unknown as jest.Mock;
// Same for the username hook
const mockedUsernameStatus = useUsernameAvailability as jest.Mock;
 
// Derive the type of the object userEvent.setup() returns, so helpers can accept it as a parameter
type User = ReturnType<typeof userEvent.setup>;
 
// setup(): the one place that creates a user + renders the component (avoids repeating this in every test)
const setup = () => {
    // Create a fresh simulated user for this test
    const user = userEvent.setup();
    // Mount the component into the fake DOM
    render(<AuthPageComp />);
    // Give the test the user so it can click/type
    return { user };
};
 
// Helper: click the second tab (its label is "Sign In" in your UI, even though it's the signup tab)
const openSignupTab = (user: User) => user.click(screen.getByRole("tab", { name: "Sign In" }));
 
// Helper: fill name, username and email on the signup form
const fillIdentity = async (user: User) => {
    // getByPlaceholderText finds the input by its placeholder; user.type types key by key
    await user.type(screen.getByPlaceholderText("Name"), "Hussain");
    // Type the username
    await user.type(screen.getByPlaceholderText("Username"), "hussain22");
    // Type a valid-looking email (this also makes the "Send Email OTP" button appear)
    await user.type(screen.getByPlaceholderText("Email"), "hussain@example.com");
};
 
// Helper: complete the email OTP flow (send, then verify)
const verifyEmail = async (user: User) => {
    // findByRole waits for the element to appear (the sender only shows after a valid email) then we click it
    await user.click(await screen.findByRole("button", { name: "Send Email OTP" }));
    // After sending, the verifier replaces the sender; wait for it and click "verify"
    await user.click(await screen.findByRole("button", { name: "Verify Email OTP" }));
};
 
// Helper: type both password fields
const fillPasswords = async (user: User, password: string, confirm: string) => {
    // Exact-match placeholder "Password" (does NOT match "Confirm Password", since matching is whole-string by default)
    await user.type(screen.getByPlaceholderText("Password"), password);
    // Type into the confirm field
    await user.type(screen.getByPlaceholderText("Confirm Password"), confirm);
};
 
// Helper: click the signup submit button (the only BUTTON named exactly "Sign In"; the tab has role "tab", social buttons have longer names)
const submitSignup = (user: User) => user.click(screen.getByRole("button", { name: "Sign In" }));
 
// Runs before EVERY test so tests never affect each other
beforeEach(() => {
    // Wipe call history AND implementations of all mocks (clearAllMocks would keep old implementations and leak between tests)
    jest.resetAllMocks();
    // Empty jsdom's localStorage (the component saves the active tab there)
    localStorage.clear();
    // Empty sessionStorage (the component sets a justLoggedIn flag there)
    sessionStorage.clear();
    // Default: username status is "idle" (no message shown)
    mockedUsernameStatus.mockReturnValue("idle");
    // Default: signIn succeeds (resolves with no error)
    mockedSignIn.mockResolvedValue({ error: null });
    // Default: errors are NOT axios errors (individual tests override this)
    mockedIsAxiosError.mockReturnValue(false);
});
 
/* ------------------------------------------------------------------ */
/* TESTS                                                               */
/* ------------------------------------------------------------------ */
 
// Group: tab switching and localStorage persistence
describe("AuthPageComp - tabs & persistence", () => {
    // Test: what does a first-time visitor see?
    it("shows the login form by default", () => {
        // Mount the component (no user interaction needed, so we ignore the returned user)
        setup();
        // The login submit button should be visible
        expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
        // queryBy* returns null instead of throwing, so we can assert something is ABSENT: signup-only field must not exist
        expect(screen.queryByPlaceholderText("Confirm Password")).not.toBeInTheDocument();
    });
 
    // Test: clicking the second tab swaps forms
    it("switches to the signup form when the second tab is clicked", async () => {
        // Mount and get a user
        const { user } = setup();
        // Click the signup tab
        await openSignupTab(user);
 
        // A signup-only field is now visible
        expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();
        // And the login-only button is gone (Radix unmounts inactive tab content)
        expect(screen.queryByRole("button", { name: "Log In" })).not.toBeInTheDocument();
    });
 
    // Test: the chosen tab is remembered
    it("saves the chosen tab to localStorage", async () => {
        // Mount and get a user
        const { user } = setup();
        // Switch to signup
        await openSignupTab(user);
        // The component should have written the new tab name to localStorage
        expect(localStorage.getItem("authFormType")).toBe("signup");
    });
 
    // Test: a remembered tab is restored on the next visit
    it("restores a saved tab on mount", async () => {
        // Pretend the user picked signup on a previous visit (must be set BEFORE render)
        localStorage.setItem("authFormType", "signup");
        // Mount the component
        setup();
        // findBy* waits: the restore happens in useEffect AFTER the first render, so the signup form appears slightly later
        expect(await screen.findByPlaceholderText("Confirm Password")).toBeInTheDocument();
    });
 
    // Test: bad saved data must not break the UI
    it("ignores an invalid saved tab value", () => {
        // Store a value the component doesn't recognise
        localStorage.setItem("authFormType", "garbage");
        // Mount the component
        setup();
        // It should fall back to the login form
        expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
    });
});
 
// Group: everything on the login tab
describe("AuthPageComp - login", () => {
    // Test: the eye icon shows/hides the password
    it("toggles password visibility", async () => {
        // Mount and get a user
        const { user } = setup();
        // Grab the password input
        const input = screen.getByPlaceholderText("Password");
        // Initially it must be masked
        expect(input).toHaveAttribute("type", "password");
 
        // The eye button has no accessible name (no aria-label), so find it INSIDE the input's wrapper div using `within`
        const toggle = within(input.parentElement as HTMLElement).getByRole("button");
        // Click once to reveal
        await user.click(toggle);
        // Now the text should be visible
        expect(input).toHaveAttribute("type", "text");
 
        // Click again to hide
        await user.click(toggle);
        // Back to masked
        expect(input).toHaveAttribute("type", "password");
    });
 
    // Test: the happy path
    it("signs in with credentials and redirects home on success", async () => {
        // Mount and get a user
        const { user } = setup();
        // Type the email
        await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
        // Type the password
        await user.type(screen.getByPlaceholderText("Password"), "secret123");
        // Submit the form
        await user.click(screen.getByRole("button", { name: "Log In" }));
 
        // react-hook-form submits asynchronously, so we wait until signIn has been called
        await waitFor(() =>
            // Assert the exact arguments the component passed to NextAuth
            expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
                // The email we typed
                email: "a@b.com",
                // The password we typed
                password: "secret123",
                // redirect:false so the component handles navigation itself
                redirect: false,
            })
        );
        // The success toast was shown (note: the component's text has the typo "successfull")
        expect(toast.success).toHaveBeenCalledWith("Log in successfull");
        // And the user was sent to the home page
        expect(mockReplace).toHaveBeenCalledWith("/");
    });
 
    // Test: wrong credentials
    it("shows an error and does NOT redirect when signIn returns an error", async () => {
        // Make the fake signIn resolve with an error (NextAuth does NOT throw on bad credentials, it returns { error })
        mockedSignIn.mockResolvedValue({ error: "CredentialsSignin" });
        // Mount and get a user
        const { user } = setup();
        // Type email
        await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
        // Type a wrong password
        await user.type(screen.getByPlaceholderText("Password"), "wrong");
        // Submit
        await user.click(screen.getByRole("button", { name: "Log In" }));
 
        // Wait for the error toast
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Invalid credentials"));
        // The failure must also be logged with the raw error code
        expect(clientLogger.error).toHaveBeenCalledWith("Something went wrong while login", {
            message: "CredentialsSignin",
        });
        // No redirect on failure
        expect(mockReplace).not.toHaveBeenCalled();
        // No success toast on failure
        expect(toast.success).not.toHaveBeenCalled();
    });
 
    // Test: signIn itself blows up (e.g. network)
    it("logs and stays on the page when signIn throws", async () => {
        // Make the fake signIn REJECT (throw) this time
        mockedSignIn.mockRejectedValue(new Error("network down"));
        // Mount and get a user
        const { user } = setup();
        // Fill email
        await user.type(screen.getByPlaceholderText("Email"), "a@b.com");
        // Fill password
        await user.type(screen.getByPlaceholderText("Password"), "secret123");
        // Submit
        await user.click(screen.getByRole("button", { name: "Log In" }));
 
        // Wait until the catch block has logged
        await waitFor(() =>
            // The catch block extracts error.message because it's a plain Error (not an axios error)
            expect(clientLogger.error).toHaveBeenCalledWith(
                // The exact log text used in the component
                "Something went wrong, while fetching the user",
                // The extracted message
                { message: "network down" }
            )
        );
        // Still no redirect
        expect(mockReplace).not.toHaveBeenCalled();
    });
 
    // A placeholder test: it.todo shows up in the report as a reminder without failing
    // (the catch block has `// toast.error()` commented out, so the user currently sees nothing)
    it.todo("shows a toast when signIn throws");
 
    // it.each runs the same test once per row: [button label, provider name]
    it.each([
        ["Log in With Google", "google"],
        ["Log In With GitHub", "github"],
        // %s in the title is replaced by the row values
    ])("'%s' sets the justLoggedIn flag and calls signIn('%s')", async (label, provider) => {
        // Mount and get a user
        const { user } = setup();
        // Click the social button by its visible label
        await user.click(screen.getByRole("button", { name: label }));
 
        // The component sets this flag right before redirecting to the provider
        expect(sessionStorage.getItem("justLoggedIn")).toBe("true");
        // And it starts the OAuth flow with the right provider and callback URL
        expect(mockedSignIn).toHaveBeenCalledWith(provider, { callbackUrl: "/" });
    });
});
 
// Group: everything on the signup tab
describe("AuthPageComp - signup", () => {
    // Run the same test for each username status the hook can return: [status, text the UI should show]
    it.each([
        ["checking", "Checking..."],
        ["available", "Available"],
        ["taken", "Already Taken"],
    ])("renders the '%s' username status", async (status, text) => {
        // Make the mocked hook return this status (set BEFORE render so the first render uses it)
        mockedUsernameStatus.mockReturnValue(status);
        // Mount and get a user
        const { user } = setup();
        // Go to the signup tab where the username field lives
        await openSignupTab(user);
        // The matching message should be visible
        expect(screen.getByText(text)).toBeInTheDocument();
    });
 
    // Test: the OTP button is gated by email validity
    it("only offers the email OTP once the email looks valid", async () => {
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
 
        // Type something that is NOT an email
        await user.type(screen.getByPlaceholderText("Email"), "not-an-email");
        // The sender button must not be there yet
        expect(screen.queryByRole("button", { name: "Send Email OTP" })).not.toBeInTheDocument();
 
        // Clear the field so we can retype
        await user.clear(screen.getByPlaceholderText("Email"));
        // Type a valid email
        await user.type(screen.getByPlaceholderText("Email"), "hussain@example.com");
        // Now the sender button should appear
        expect(screen.getByRole("button", { name: "Send Email OTP" })).toBeInTheDocument();
    });
 
    // Test: the full OTP flow
    it("walks through send OTP -> verify OTP", async () => {
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Fill name/username/email (email must be valid so the sender appears)
        await fillIdentity(user);
 
        // Click the fake "send" button, which calls the component's onOtpSent callback
        await user.click(screen.getByRole("button", { name: "Send Email OTP" }));
        // The component should announce the OTP was sent
        expect(toast.success).toHaveBeenCalledWith("Email OTP sent successfully!");
 
        // Click the fake "verify" button, which calls the component's onVerified callback
        await user.click(screen.getByRole("button", { name: "Verify Email OTP" }));
        // The component should announce verification
        expect(toast.success).toHaveBeenCalledWith("Email OTP verified successfully!");
        // And replace the widgets with the "verified" message
        expect(screen.getByText("Email Verified! ✅")).toBeInTheDocument();
    });
 
    // Test: user typed the wrong email and wants to restart
    it("returns to the sender step when the user chooses to change email", async () => {
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Fill the form
        await fillIdentity(user);
        // Send the OTP so the verifier step is showing
        await user.click(screen.getByRole("button", { name: "Send Email OTP" }));
 
        // Click "Change Email" in the verifier
        await user.click(screen.getByRole("button", { name: "Change Email" }));
        // We are back at the sender step
        expect(screen.getByRole("button", { name: "Send Email OTP" })).toBeInTheDocument();
        // And the verifier is gone
        expect(screen.queryByRole("button", { name: "Verify Email OTP" })).not.toBeInTheDocument();
    });
 
    // Test: the guard clause at the top of handleSignupSubmit
    it("blocks submit until the email is verified", async () => {
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Fill identity (but do NOT verify the email)
        await fillIdentity(user);
        // Fill matching passwords so ONLY the email check can fail
        await fillPasswords(user, "secret123", "secret123");
        // Try to submit
        await submitSignup(user);
 
        // Wait for the guard's toast
        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith("Please verify your email address")
        );
        // Crucially, no request was sent to the server
        expect(mockedPost).not.toHaveBeenCalled();
    });
 
    // Test: password mismatch (inline hint + submit guard)
    it("shows an inline warning and blocks submit when passwords differ", async () => {
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Fill identity
        await fillIdentity(user);
        // Verify email so the email guard passes and the password guard is what we hit
        await verifyEmail(user);
        // Type two different passwords
        await fillPasswords(user, "secret123", "different");
 
        // The <p> hint under the confirm field should already be visible while typing
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
 
        // Try to submit anyway
        await submitSignup(user);
        // The submit handler's guard shows a toast
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Passwords do not match"));
        // No request sent
        expect(mockedPost).not.toHaveBeenCalled();
    });
 
    // Test: the full happy path
    it("registers, auto signs in, and redirects on the happy path", async () => {
        // Make the register API succeed
        mockedPost.mockResolvedValue({ data: {} });
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Fill identity
        await fillIdentity(user);
        // Verify the email
        await verifyEmail(user);
        // Matching passwords
        await fillPasswords(user, "secret123", "secret123");
        // Submit
        await submitSignup(user);
 
        // Wait for the register request
        await waitFor(() =>
            // Check the URL and (partially) the body
            expect(mockedPost).toHaveBeenCalledWith(
                // Endpoint the component posts to
                "/api/users/register",
                // objectContaining = "at least these fields" (the body also has profileImage, phoneNumber, etc. we don't care about)
                expect.objectContaining({
                    // Typed name
                    name: "Hussain",
                    // Typed username
                    username: "hussain22",
                    // Typed email
                    email: "hussain@example.com",
                    // Typed password
                    password: "secret123",
                    // Default role from the form's defaultValues
                    role: "USER",
                })
            )
        );
        // After registering, the component logs the user in automatically
        expect(mockedSignIn).toHaveBeenCalledWith("credentials", {
            // Same email
            email: "hussain@example.com",
            // Same password
            password: "secret123",
            // Handle navigation ourselves
            redirect: false,
        });
        // Success toast
        expect(toast.success).toHaveBeenCalledWith("Signup successful");
        // Redirect home
        expect(mockReplace).toHaveBeenCalledWith("/");
    });
 
    // Test: register request fails
    it("stops after a failed register call (no auto sign-in, no redirect)", async () => {
        // Make the register call reject
        mockedPost.mockRejectedValue(new Error("boom"));
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Fill identity
        await fillIdentity(user);
        // Verify email
        await verifyEmail(user);
        // Matching passwords
        await fillPasswords(user, "secret123", "secret123");
        // Submit
        await submitSignup(user);
 
        // Wait until the catch block logs
        await waitFor(() => expect(clientLogger.error).toHaveBeenCalled());
        // Because the await axios.post threw, signIn must never have run
        expect(mockedSignIn).not.toHaveBeenCalled();
        // And no redirect
        expect(mockReplace).not.toHaveBeenCalled();
    });
 
    // Test: the axios-specific branch of the catch block
    it("extracts the server message from an axios error", async () => {
        // Tell the component's `axios.isAxiosError(error)` check to return true
        mockedIsAxiosError.mockReturnValue(true);
        // Reject with an object shaped like an AxiosError: server message inside response.data.message
        mockedPost.mockRejectedValue({
            // Generic axios message (should be IGNORED because a server message exists)
            message: "Request failed with status code 409",
            // The server's response body
            response: { data: { message: "Email already exists" } },
        });
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Fill identity
        await fillIdentity(user);
        // Verify email
        await verifyEmail(user);
        // Matching passwords
        await fillPasswords(user, "secret123", "secret123");
        // Submit
        await submitSignup(user);
 
        // Wait for the log call
        await waitFor(() =>
            // The logged message must be the SERVER's message, proving the `error.response?.data?.message` branch ran
            expect(clientLogger.error).toHaveBeenCalledWith(
                // Log text from the component
                "Something went wrong, while fetching the user",
                // The server message, not the generic axios one
                { message: "Email already exists" }
            )
        );
    });
 
    // Test: registration worked but the automatic login after it failed
    it("shows a retry toast when register works but the auto sign-in fails", async () => {
        // Register succeeds
        mockedPost.mockResolvedValue({ data: {} });
        // But the automatic sign-in returns an error
        mockedSignIn.mockResolvedValue({ error: "CredentialsSignin" });
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Fill identity
        await fillIdentity(user);
        // Verify email
        await verifyEmail(user);
        // Matching passwords
        await fillPasswords(user, "secret123", "secret123");
        // Submit
        await submitSignup(user);
 
        // Wait for the retry toast
        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith("Something went wrong. Please try again.")
        );
        // The user must NOT be redirected as if everything worked
        expect(mockReplace).not.toHaveBeenCalled();
    });
 
    // Placeholder reminder: a failed register request only logs, so the user gets no feedback
    it.todo("shows a toast when the register request fails");
 
    // Same social-login test as on the login tab, but from the signup tab (different buttons, different labels)
    it.each([
        ["Sign In with Google", "google"],
        ["Sign In with GitHub", "github"],
    ])("'%s' calls signIn('%s') from the signup tab", async (label, provider) => {
        // Mount and get a user
        const { user } = setup();
        // Go to signup
        await openSignupTab(user);
        // Click the social button
        await user.click(screen.getByRole("button", { name: label }));
 
        // The pre-redirect flag was set
        expect(sessionStorage.getItem("justLoggedIn")).toBe("true");
        // The OAuth flow started with the right provider
        expect(mockedSignIn).toHaveBeenCalledWith(provider, { callbackUrl: "/" });
    });
});