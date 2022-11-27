import { isObservableObject } from "mobx"

const TreeSelect = ({ store }) => {
    return (
        <>
            <div>
                Hello!<br/> 
                This is my value: {store.value}<br/>
                And my other props are in the console.
            </div>
        </>
    )
}

export default TreeSelect