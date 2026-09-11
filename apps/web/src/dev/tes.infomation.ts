// jest.fn() creates a fake function — one that:

// Does nothing by default (returns undefined), so it never touches real code(no real API call, no real navigation, no real toast popup).
// Remembers how it was called — arguments, call count — so you can assert expect(fn).toHaveBeenCalledWith(...).
// Can be told what to return, via.mockResolvedValueOnce(...) or.mockRejectedValueOnce(...), so you control the exact scenario(success vs failure) per test.