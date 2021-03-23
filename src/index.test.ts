jest.mock("axios");
import axios, { AxiosInstance } from "axios";
import { assert } from "node:console";
import WithingsClient from "./index";

// tslint:disable-next-line:no-any
const myAxios: jest.Mocked<AxiosInstance> = axios as any;

const client = new WithingsClient("clientId", "clientSecret", "callbackUrl");
describe("getNonce", () => {
  it("axios return mock value", async () => {
    // tslint:disable-next-line:no-any
    (myAxios.post as any).mockResolvedValue({
      data: { body: { nonce: "Mock response!!!" } },
    });

    const res = await client.getNonce();
    expect(res.body.nonce).toBe("Mock response!!!");
  });
});
