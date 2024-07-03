export class WebRTCServer {
  private nodeSocket: WebSocket | null = null;

  private ipcPort: number;
  private id: string;
  private ipcSockets: Map<string, WebSocket> = new Map();

  constructor(id: string, ipcPort: number) {
    this.ipcPort = ipcPort;
    this.id = id;
  }

  async start() {
    await this.startNodeProcesses();
    this.startIPCServer();
    const sock = await this.createWebSocket(this.ipcPort);
    return sock;
  }

  private async startNodeProcesses() {
    await this.startNodeProcess(this.id);
  }

  private createWebSocket(ipcPort: number) {
    return new WebSocket(`ws://localhost:${ipcPort}`);
  }
  private startNodeProcess(id: string) {
    const command = new Deno.Command("node", {
      args: [
        "-e",
        `require('child_process').execSync('npx ts-node nodeWebRTC/webrtc.ts ${id} ${this.ipcPort}', {stdio: 'inherit'})`,
      ],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    });
    const nodeProcess = command.spawn();

    const decoder = new TextDecoder();
    const output = nodeProcess.stdout.getReader();
    const errorOutput = nodeProcess.stderr.getReader();

    const readStream = async (
      stream: ReadableStreamDefaultReader<Uint8Array>,
    ) => {
      while (true) {
        const { value, done } = await stream.read();
        if (done) break;
        const decodedValue = decoder.decode(value);
        const lines = decodedValue.split("\n");
        const nonEmptyLines = lines.filter((line) => line.trim() !== "");
        const idPartBeforeAt = id.split("@")[0];
        const prefixedLines = nonEmptyLines.map((line) =>
          `[RTC NODE: ${idPartBeforeAt}]: ${line}`
        );
        const formattedOutput = prefixedLines.join("\n");
        console.log(formattedOutput);
      }
    };

    readStream(output);
    readStream(errorOutput);
  }
  private startIPCServer() {
    Deno.serve({ port: this.ipcPort }, (req) => {
      if (req.headers.get("upgrade") != "websocket") {
        return new Response(null, { status: 501 });
      }
      const { socket, response } = Deno.upgradeWebSocket(req);

      socket.addEventListener("open", () => {
        console.log("IPC client connected!");
      });

      socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);

        console.log("msg from ipc", data);
        if (data.peerIdSet) {
          if (data.peerIdSet === this.id) {
            this.nodeSocket = socket;
          }
        } else if (data.type === "portalSet") {
          this.ipcSockets.set(data.payload, socket);
        }else if (data.type === "query_dataPeersReturn") {
          console.log("query_dataPeersReturn");
          if (data.rtcmessage) {
            try {
              this.ipcSockets.get(data.targetPeerId)?.send(JSON.stringify({
                type: "query_dataPeers",
                rtcmessage: data.rtcmessage,
              }));
            } catch (e) {
              console.log("error sending query_dataPeers", e);
            }
          }
        } else if (data.type === "webrtc_message_custom") {
          console.log("received custom webrtc message");
          console.log("xx",this.ipcSockets);
          console.log("xx",data);
          const rtcmessage = JSON.parse(data.rtcmessage);
          const { address: { to } } = rtcmessage;
          console.log("to",to); 

          if (this.ipcSockets.has(to)) {
            console.log("sending webrtc message to ipc socket");
            this.ipcSockets.get(to)?.send(JSON.stringify(data));
          }

          
        } else {
          this.nodeSocket?.send(JSON.stringify(data));
        }
      });

      return response;
    });
    console.log(`IPC server is running on ws://localhost:${this.ipcPort}`);
  }
}
