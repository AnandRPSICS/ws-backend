export const createRoomId = () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const charsLength = chars.length;
    let roomId = ""; 
    const roomIdLength = 6;
    for (let i = 0; i < roomIdLength; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    return roomId;
}