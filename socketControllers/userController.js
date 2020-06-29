import { v4 as uuidv4  } from 'uuid';

const controller = {
    setName: async (socket,redis, data) => {
        const user = {
            id: data.userId,
            name: data.userName
        }
        if (!user.id) {
            user.id = uuidv4()
        } 
        // socket.userName = data.userName
        console.log("res",user)
        try {
            const status = await redis.hset([user.id,"userName",user.name]);
            console.log("res", status)
            
            const respData = {
                status: 'success',
                socketId: socket.id,
                userData: user
            }
            socket.emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            const respData = {
                status: 'fail',
                error: {
                    code: 11111,
                    description: `unexpected error:${error}`
                }
            }
            socket.emit('response', respData)
        }
               
        // socket.to(curRoomName).emit('message', {
        //     userName: 'System',
        //     message: `Now we have ${users} players.
        //     Welcome new player ${socket.userName}.`
        // })
    }
}
export default controller