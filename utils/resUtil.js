/**
 * Defined res data format
 * 
 * null success
 * 10000 validation error
 * 10001 game error
 * 10002 game not found
 * 10003 no authorization
 * 10004 system error
 * 11110 input not qualified
 * 11111 unexpected error
 */

const resUtil = {
	getDefaultRes: () => {
        const respData = {
            status: 'success',
            error: {
                code: null,
                description: null
            },
            data: {}
        }
        return respData
    }
}

export default resUtil
