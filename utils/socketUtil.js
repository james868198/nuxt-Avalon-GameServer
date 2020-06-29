import Socket from 'socket.io';

const getRoomList = (room) => {
    const list = Socket.clients(room)
    return list
}
export default {
    getRoomList
}