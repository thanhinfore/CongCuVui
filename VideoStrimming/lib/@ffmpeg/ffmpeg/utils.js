let messageID = 0;

export const getMessageID = () => {
  messageID += 1;
  return messageID;
};
