/*
 * @Author: your name
 * @Date: 2021-02-09 16:58:09
 * @LastEditTime: 2021-02-12 01:51:34
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /ivan个人练习代码/ReactLearn/vdmock.js
 * 
 */



// import pkg from 'jsdom';
// const { JSDOM } = pkg;
//  export const { document } = (new JSDOM(`...`)).window;


export class Element{
    constructor(tagName,attrs = {},child = []){
        this.tagName = tagName
        this.attrs = attrs
        this.child = child
    }
    render(){
        let ele = document.createElement(this.tagName)
        let attrs = this.attrs
        for(let key in attrs){
            SetVdToDom(ele,key,attrs[key])
        }
        let childNodes = this.child
        childNodes.forEach(function(child){
           let childEle  = child instanceof Element ? 
           child.render() : document.createTextNode(child)
             ele.appendChild(childEle)
        })
     return ele  
    }
}
export function newElement(tag,attr,child){
    return new Element(tag,attr,child)
}
 export const SetVdToDom = function(node,key,value){
    switch(key){
        case 'style':
        node.style.cssText = value
        break
        case 'value':
            let tagName = node.tagName || ''
            tagName = tagName.toLowerCase()
            if(tagName === 'input' || tagName === 'textarea'){//注意input类型的标签
                node.value = value
            }else{
                node.setAttribute(key,value)
            }
            break
            default:
                node.setAttribute(key,value)
                break
    }
}

const diff = (oldNode,newNode)=>{
    let difference = {} //用来保存两个节点之间的差异
    getDiff(oldNode,newNode,0,difference)
    return difference
}
const REMOVE = 'remove'
const MODIFY_TEXT =  'modify_text'
const CHANGE_ATTRS = 'change_attrs'
const TAKEPLACE = 'replace'
let initIndex = 0
const getDiff = (oldNode,newNode,index,difference)=>{
    let diffResult = []
    //新节点不存在的话说明节点已经被删除
    if(!newNode){
        diffResult.push({
            index,
            type: REMOVE
        }) //如果是文本节点直接替换就行
    }else if(typeof newNode === 'string' && typeof oldNode === 'string'){
        if(oldNode !== newNode){
            diffResult.push({
                index,
                value: newNode,
                type: MODIFY_TEXT
            })
        } //如果节点类型相同则则继续比较属性是否相同
    }else if(oldNode.tagName === newNode.tagName){
        let storeAttrs = {}
        for(let  key in oldNode.attrs){ 
            if(oldNode.attrs[key] !== newNode.attrs[key]){
               
                storeAttrs[key] = newNode.attrs[key]
            }
        }
        for (let key in newNode.attrs){
            if(!oldNode.attrs.hasOwnProperty(key)){
                storeAttrs[key] = newNode[key]
            }
        }   
        
        //判断是否有不同
        if(Object.keys(storeAttrs).length>0){
            diffResult.push({
                index,
                value: storeAttrs,
                type: CHANGE_ATTRS
            })
        } //遍历子节点
        oldNode.child.forEach((child,index)=>{
            //深度遍历所以要保留index
             getDiff(child,newNode.child[index],++initIndex,difference)
        }) 
        //如果类型不相同，那么无需对比直接替换掉就行
    }else if(oldNode.tagName !== newNode.tagName){
        diffResult.push({
            type: TAKEPLACE,
            index,
            newNode
        })
    } //最后将结果返回
    if(!oldNode){
        diffResult.push({
            type: TAKEPLACE,
            newNode
        })
    }
    if(diffResult.length){
        difference[index] = diffResult
    }
}


const fixPlace = (node,difference)=>{
    let pacer = { index: 0 }
    pace(node,pacer,difference)
}
/*
接收一个真实DOM（需要更新节点）,接收diff过后的最小差异集合
*/

const pace = (node,pacer,difference) =>{
    
    let currentDifference = difference[pacer.index]
    let childNodes = node.childNodes
    console.log(difference)
    childNodes.forEach((child)=>{
        pacer.index ++
        pace(child,pacer,difference)
    })
    if(currentDifference){
        doFix(node,currentDifference)
    }
}

const doFix = (node,difference) =>{
     difference.forEach(item=>{
         switch (item.type){
             case 'change_attrs':
                 const attrs = item.value
                 for( let key in attrs ){
                     if(node.nodeType !== 1) 
                     return 
                     const value = attrs[key]
                     if(value){
                         SetVdToDom(node,key,value)
                         
                     }else{
                         node.removeAttribute(key)
                     }
                 }
                 break
                 case 'modify_text':
                     node.textContent = item.value
                     break
                case 'replace': 
                   let newNode = (item.newNode instanceof Element) ? item.newNode.render(item.newNode) : 
                   document.createTextNode(item.newNode)
                    node.parentNode.replaceChild(newNode,node)
                    break
                case 'remove' :
                    node.parentNode.removeChild(node)
                    break
                default: 
                    break
         }
     })
}

const VdObj1 = newElement('ul',{id: 'list'},[
    newElement('li',{class: 'list',style:'color:red' }, ['lavie']),
    newElement('li',{class: 'list' }, ['virtual dom']),
    newElement('li',{class: 'list' }, ['React']),  
    newElement('li',{class: 'list' }, ['Vue']) 
])
const VdObj = newElement('ul',{id: 'list'},[
    newElement('li',{class: 'list',style:'color:red' }, ['lavie']),
    newElement('li',{class: 'list' }, ['virtual dom']),
    newElement('li',{class: 'list' }, ['React']),  
    newElement('li',{class: 'list-1' }, ['Vue'])

])
const RealDom = VdObj1.render()
const renderDom = function(element,target){
    target.appendChild(element)
}
export default function start(){
   renderDom(RealDom,document.body)
   const diffs = diff(VdObj1,VdObj)
   console.log(diffs)
   fixPlace(RealDom,diffs)
}
