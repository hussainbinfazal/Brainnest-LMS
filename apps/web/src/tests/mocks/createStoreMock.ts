//shared fake store implementations factory

import type { StoreApi, UseBoundStore } from "zustand";
export function createStoreMock<T extends object>(useStoreHook: UseBoundStore<StoreApi<T>>,
    defaultState: T
) {
    return function mockStore(overrides: Partial<T> = {}) {
        const state = { ...defaultState, ...overrides };
        (useStoreHook as unknown as jest.Mock).mockImplementation(
            (selector?: (storeState: T) => unknown) =>
                selector ? selector(state) : state
        );
        (useStoreHook as unknown as { getState: jest.Mock }).getState = jest.fn(() => state);
        return state;

    }

}