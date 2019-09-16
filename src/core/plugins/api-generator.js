/* global Promise */

import { createSelector } from "reselect"
import { Map } from "immutable"

export default function apiGeneratorPlugin (toolbox) {
  
  let { fn } = toolbox

  const actions = {
    generateApi: (apiList)=> ({ getConfigs,errActions,apiGeneratorActions }) => {
      debugger
      let { fetch } = fn
      const config = getConfigs()
      fetch({
        url:config.serverAddress+"generateApi",
        method: "post",
        body: JSON.stringify({apiList:apiList}),
        requestInterceptor: config.requestInterceptor || (a => a),
        responseInterceptor: config.responseInterceptor || (a => a),
        headers: {"Content-Type": "application/json" }
      }).then(next,next)

      function next(res) {
        console.log(res)
        if(res instanceof Error || res.status >= 400) {
          errActions.newThrownErr(Object.assign( new Error((res.message || res.statusText)), {source: "fetch"}))
          return
        }
        //成功了
        apiGeneratorActions.updateApiGenerateMsg(res.obj)
      }
    },
    updateApiGenerateMsg: (msg) => {
        return {
          type: "api_generate_update_msg",
          payload: msg
        }
      }
  }

  let reducers = {
    "api_generate_update_msg": (state, action) => {
      return  state.set("apiGenerateMsg", action.payload)
    }
  }

  let selectors = {
    apiGenMsg: createSelector(
      state => {
        return state || Map()
      },
      apiGenerator => apiGenerator.get("apiGenerateMsg") || null
    )
  }

  return {
    statePlugins: {
      apiGenerator: { actions, reducers, selectors }
    }
  }
}
