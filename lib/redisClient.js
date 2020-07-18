
const redis = require('redis')
const { promisify } = require("util")

// const redisClient  = redis.createClient({
//     port      : 6379,               // replace with your port
//     host      : '120.0.0.1',        // replace with your hostanme or IP address
//     password  : 'avalonv3_2020'    // replace with your password
// });

class redisClient {
    constructor() {
        this.client = redis.createClient()
        this.isConnected()
    }
    async isConnected() {
        const on = promisify(this.client.on).bind(this.client);
        const isOn =  await on('connect').then(() =>{
            console.log("Redis Connected")
            return true
        }).catch((err) =>{
            console.error(err)
            return false
        })
        return isOn
    }
    async setKey(key, val) {
        const set = promisify(this.client.set).bind(this.client)
        const status =  await set(key,val)
        return status
    }
    async setMkey(keys,values) {
        if (keys.length !== values.length) {
            return False
        }
        const mset = promisify(this.client.mset).bind(this.client)
        const status =  await mset(keys,values)
        return status
    }
    async hset(data) {
        const hset = promisify(this.client.hset).bind(this.client)
        const status =  await hset(data)
        return status
    }
    async hget(key, field) {
        
        const hget = promisify(this.client.hget).bind(this.client)
        const res =  await hget(key,field).then((res) =>{
            return res
        }).catch((err) =>{
            console.error(err)
            return false
        })
        return res
    }
    async getVal(key) {
        const get = promisify(client.get).bind(client)
        const value =  await get(key).then((res) => {return res})
        return value
    }
}

export default redisClient

