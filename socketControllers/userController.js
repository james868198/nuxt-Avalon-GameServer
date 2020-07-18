import { v4 as uuidv4  } from 'uuid';
import resUtil from '../utils/resUtil'

const controller = {
    createUser: async (socket,redis, data) => {
        const respData = resUtil.getDefaultRes()

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
            const status = await redis.hset([user.id, "userName",user.name]);
            console.log("res", status)
            
            respData['data']['user'] = user
            socket.emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
               
        // socket.to(curRoomName).emit('message', {
        //     userName: 'System',
        //     message: `Now we have ${users} players.
        //     Welcome new player ${socket.userName}.`
        // })
    },
    getUser: async (socket,redis, data) => {
        const respData = resUtil.getDefaultRes()

        // socket.userName = data.userName
        console.log("res",user)
        if (!data.userId) {
            console.log('fail: no userId')
            respData['status'] = 'fail'
            respData['error']['code'] = 10003
            respData['error']['description'] = 'no userId'
            socket.emit('response', respData)
        }
        try {
            const res = await redis.hget(user.id, "userName");
            console.log("res", res)
            // user = {
            //     name: res
            // }
            // respData['data']['user'] = user
            // socket.emit('response', respData)
        } catch (error) {
            console.log('error:', error)
            respData['status'] = 'fail'
            respData['error']['code'] = 11111
            respData['error']['description'] = `unexpected error:${error}`
            socket.emit('response', respData)
        }
    }
}
export default controller