import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
class ResizeObserverMock {
    observe() { }
    unobserve() { }
    disconnect() { }
}
(global as any).ResizeObserver = ResizeObserverMock;

// jsdom doesn't implement IntersectionObserver either
class IntersectionObserverMock {
    root = null;
    rootMargin = "";
    thresholds = [];
    observe() { }
    unobserve() { }
    disconnect() { }
    takeRecords() {
        return [];
    }
}
(global as any).IntersectionObserver = IntersectionObserverMock;