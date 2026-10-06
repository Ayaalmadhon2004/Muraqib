import http from "http";
import https from "https";
import tls from "tls";
import { URL } from "url";

export interface HttpProbeResult {
  reachable: boolean;
  /** Protocol actually negotiated with the server, e.g. "HTTP/2" or "HTTP/1.1". */
  protocol: string;
  /** Total bytes of the cookies (name=value) the server sets on this URL. */
  cookiesSizeBytes: number;
  error?: string;
}

const TIMEOUT_MS = 10000;

const negotiatesHttp2 = (url: URL): Promise<boolean> =>
  new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: url.hostname,
        port: Number(url.port) || 443,
        servername: url.hostname,
        ALPNProtocols: ["h2", "http/1.1"],
        timeout: TIMEOUT_MS,
      },
      () => {
        const isH2 = socket.alpnProtocol === "h2";
        socket.end();
        resolve(isH2);
      }
    );
    socket.on("error", reject);
    socket.on("timeout", () => socket.destroy(new Error("TLS handshake timed out")));
  });

const fetchHead = (url: URL): Promise<http.IncomingMessage> =>
  new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const req = client.get(url, { timeout: TIMEOUT_MS }, (res) => {
      res.resume();
      resolve(res);
    });
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
  });

/**
 * Measures the protocol and cookie weight of a live URL.
 * Nothing is guessed: if the URL cannot be reached, `reachable` is false.
 */
export async function probeHttp(targetUrl: string): Promise<HttpProbeResult> {
  try {
    const url = new URL(targetUrl);
    const res = await fetchHead(url);

    let protocol = `HTTP/${res.httpVersion}`;
    if (url.protocol === "https:" && (await negotiatesHttp2(url))) {
      protocol = "HTTP/2";
    }

    const cookiesSizeBytes = (res.headers["set-cookie"] ?? [])
      .map((cookie) => cookie.split(";")[0] ?? "")
      .reduce((total, pair) => total + Buffer.byteLength(pair), 0);

    return { reachable: true, protocol, cookiesSizeBytes };
  } catch (error) {
    return {
      reachable: false,
      protocol: "unknown",
      cookiesSizeBytes: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
