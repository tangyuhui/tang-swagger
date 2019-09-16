import React from "react"
import PropTypes from "prop-types"
import Im from "immutable"
import { Drawer,Button,Input,Skeleton  } from 'antd';

const { TextArea } = Input;

const SWAGGER2_OPERATION_METHODS = [
  "get", "put", "post", "delete", "options", "head", "patch"
]
const OAS3_OPERATION_METHODS = SWAGGER2_OPERATION_METHODS.concat(["trace"])


export default class Operations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      apiArray: [],
      visible: false 
    };
  }
  static propTypes = {
    apiGeneratorActions:PropTypes.object.isRequired,
    apiGeneratorSelectors:PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    layoutSelectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,
    authActions: PropTypes.object.isRequired,
    authSelectors: PropTypes.object.isRequired,
    getConfigs: PropTypes.func.isRequired,
    fn: PropTypes.func.isRequired
  };
  showDrawer = () => {
    this.setState({
      visible: true
    });
  };

  onClose = () => {
    this.setState({
      visible: false,
    });
  };
  onApiChange=(op)=>{
     const newSelection = op;//拿到点击的具体一项
     let newSelectionArray;//新建一个空数组
    //判断点击项是否为选择状态，是的话清除选中状态
    const apiArray  = this.state.apiArray
    //存在
    if(apiArray.find(item=>{
      return item.method+item.path===newSelection.method+newSelection.path
    })){
       newSelectionArray = this.state.apiArray.filter((s) => s.path !== newSelection.path)
    }else{
       newSelectionArray =  [...this.state.apiArray, newSelection]
    }
     this.setState({
       apiArray: newSelectionArray
     });
  }
  onGenerateClick =() => { 
    this.showDrawer()
    const {apiGeneratorActions} = this.props
    apiGeneratorActions.generateApi(this.state.apiArray)
   }
   renderDrawer(){
    let {
      apiGeneratorSelectors
    } = this.props
     let apiGenMsg = apiGeneratorSelectors.apiGenMsg()
     let {apiConsts,apiFuncs} = apiGenMsg?apiGenMsg:{}
     if(apiConsts|| apiFuncs){
       return ( <div>
        <p>接口常量</p>
        <TextArea rows={4} value={apiConsts}/>
        <p className="mt10">接口方法</p>
        <TextArea rows={10} value={apiFuncs}/>
      </div>)
     }else{
      return <Skeleton active />
     }
   }
  render() {
    let {
      specSelectors,
      getComponent,
      layoutSelectors,
      layoutActions,
      getConfigs,
      fn
    } = this.props

    let taggedOps = specSelectors.taggedOperations()
    const OperationContainer = getComponent("OperationContainer", true)
    const OperationTag = getComponent("OperationTag")

    let {
      maxDisplayedTags,
    } = getConfigs()

    let filter = layoutSelectors.currentFilter()

    if (filter) {
      if (filter !== true) {
        taggedOps = fn.opsFilter(taggedOps, filter)
      }
    }

    if (maxDisplayedTags && !isNaN(maxDisplayedTags) && maxDisplayedTags >= 0) {
      taggedOps = taggedOps.slice(0, maxDisplayedTags)
    }
    return (
        <div>
          {
            taggedOps.map( (tagObj, tag) => {
              const operations = tagObj.get("operations")
              return (
                <OperationTag
                  key={"operation-" + tag}
                  tagObj={tagObj}
                  tag={tag}
                  layoutSelectors={layoutSelectors}
                  layoutActions={layoutActions}
                  getConfigs={getConfigs}
                  getComponent={getComponent}>
                  {
                    operations.map( op => {
                      const path = op.get("path")
                      const method = op.get("method")
                      const specPath = Im.List(["paths", path, method])


                      // FIXME: (someday) this logic should probably be in a selector,
                      // but doing so would require further opening up
                      // selectors to the plugin system, to allow for dynamic
                      // overriding of low-level selectors that other selectors
                      // rely on. --KS, 12/17
                      const validMethods = specSelectors.isOAS3() ?
                            OAS3_OPERATION_METHODS : SWAGGER2_OPERATION_METHODS

                      if(validMethods.indexOf(method) === -1) {
                        return null
                      }

                      return <OperationContainer
                                onApiChange={this.onApiChange}
                                 key={`${path}-${method}`}
                                 specPath={specPath}
                                 op={op}
                                 path={path}
                                 method={method}
                                 tag={tag}
                                 />
                    }).toArray()
                  }
           

                </OperationTag>
              )
            }).toArray()
          }
         <div className="operation-btn">
         <Button shape="circle" type="primary" size="large" onClick={this.onGenerateClick}>
         生成
       </Button>
       <Drawer
       width='500'
          title="生成接口"
          placement="right"
          closable={false}
          onClose={this.onClose}
          visible={this.state.visible}
        >
       {this.renderDrawer()}
        </Drawer>
         </div>
          { taggedOps.size < 1 ? <h3> No operations defined in spec! </h3> : null }
        </div>
    )
  }

}

Operations.propTypes = {
  layoutActions: PropTypes.object.isRequired,
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  layoutSelectors: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  fn: PropTypes.object.isRequired
}
