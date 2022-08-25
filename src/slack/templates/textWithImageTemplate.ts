interface Payload {
  text: string;
  image?: string;
}

export function createMessage(values: Payload) {
  const message: any = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: values.text || "A Croc Has Dropped",
      },
    },
  ];

  if (values.image) {
    message[0]["accessory"] = {
      type: "image",
      image_url: values.image || "",
      alt_text: "croc image",
    };
  }

  return message;
}
