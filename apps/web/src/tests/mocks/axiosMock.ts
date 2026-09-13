//shared axios mock helpers
// test/mocks/axiosMocks.ts
import axios from "axios";

const mockedAxios = axios as jest.Mocked<typeof axios>;

export function mockAxiosSuccess<T>(data: T, method: "get" | "post" | "put" | "delete" = "get") {
  mockedAxios[method].mockResolvedValueOnce({
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: {} as any,
  });
}

export function mockAxiosError(
  status = 500,
  message = "Server Error",
  method: "get" | "post" | "put" | "delete" = "get"
) {
  const error = {
    isAxiosError: true,
    response: {
      status,
      data: { message },
    },
    message,
  };

  mockedAxios[method].mockRejectedValueOnce(error);
  return error;
}