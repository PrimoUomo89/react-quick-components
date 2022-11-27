import { makeAutoObservable, observable } from "mobx";

export default class PropsStore {

    props = {};
    name = null;

    constructor(name, props) {
        makeAutoObservable(this, {
            props: observable.struct,
            name: false
        })
        this.name = name
        this.props = props
    }

    updateProps(propsUpdate) {
        const newProps = {
            ...props,
            propsUpdate
        }

        this.props = newProps
    }

}