import { Component } from 'react'
import type { ReactNode,ErrorInfo } from 'react'
export default class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false}
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(_error:Error,_info:ErrorInfo){ /* Do not log source files or user data. */ }
 render(){return this.state.failed?<div className="error-panel"><h1>This view needs a fresh start.</h1><p>Reload the workspace to try again. Your saved data is preserved.</p><button className="btn primary" onClick={()=>window.location.reload()}>Reload workspace</button></div>:this.props.children}
}
