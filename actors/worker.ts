


const worker = self as unknown as Worker;

worker.onmessage = async (event) => {
  console.log("Received wwwwmessage:", event.data);
};

