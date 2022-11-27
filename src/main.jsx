import { makeAutoObservable, observable, observe, configure, isObservableObject, isAction } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { Suspense } from 'react'
import { createRoot } from 'react-dom/client';
import './index.css'

class PropsStore {

  propsStore = {}

  constructor() {
    makeAutoObservable(this)
  }

  updateProps(inputName, propsUpdate) {
    let newProps = {
      ...this.propsStore[inputName],
      ...propsUpdate
    }

    this.propsStore[inputName] = newProps

    console.log(this.propsStore)
  }

  newProps(inputName, newProps) {
    this.propsStore[inputName] = newProps
  }

  useProps(inputName) {
    return this.propsStore[inputName]
  }
}



class ReactQuickComponents {

  #renderedComponents = {}
  #propsStore = new PropsStore()

  /******
   * To add something to the registry:
   * key should be #library-Component#
   *  Component is a React.lazy( () => import())
   */
  static #componentRegistry = {
    "antd-TreeSelect": React.lazy( () => import("./components/AntD/TreeSelect") )
  }

  constructor () {
    this.init()
    configure({
      enforceActions: "always",
      computedRequiresReaction: true,
      reactionRequiresObservable: true,
      observableRequiresReaction: true,
      disableErrorBoundaries: true
    })
  }

  /***
   *
   * Looks for divs and initializes components
   *
   * **/
  init () {
    
    /*****
     * A component factory, adding a small wrapper to the Component, 
     * allowing it to track the value of the input so it will be
     * available in FORM scope.
     */ 
    const FORMAccessibleComponent = ( Component ) =>
      ({ inputName, trackVar, store }) => {
        console.log(`props is observable?: ${isObservableObject(store) }`)
        return (
          <>
            <Suspense fallback={<>Loading...</>}>
              <Component store={store.useProps(inputName)} />
              <input type="hidden" name={inputName} value={store[trackVar]} />
            </Suspense>
          </>
        )
      }




    // find one or more divs.
    const nodeList = document.querySelectorAll(".react-component")

    if (nodeList.length == 0) {
      console.error(`Did not return any query results for selector ".react-component". Nothing to initialize.`)
      return 
    }

    // Cycle through nodeList rootElements and initialize all
    // Keep in mind, this nodeList is static so will not receive 
    // further updates from the DOM. This allows us to reinitialize
    // components on this Element from whatever the original dataset
    // contained.
    let count = 1
    let failed = 0
    for (const div of nodeList.values()) {

      // Verify Dataset, if missing something, skip this element.
      const thisDataset = div.dataset



      // Get inputName from Div.dataset
      if (!thisDataset.inputName) {
        console.error(`The DOMElement #${count} has no data-inputName. Skipping...`)
        failed++
        continue 
      } else if ( this.#renderedComponents[thisDataset.inputName] ) {
        console.error(`There is already a component rendered with input-name: ${thisDataset.inputName}. Skipping...`)
        failed++
        continue
      }
      const thisInputName = thisDataset.inputName



      // Props from Div.dataset
      let thisProps = {}
      if (!thisDataset.props) {
        console.warn(`The DOMElement #${count} has no data-props. Rendering with props = {}`);
      } else {
        thisProps = JSON.parse(thisDataset.props)
      }



      // Var to track from div.dataset.
      // This variable will be what the hidden input tracks,
      // and needs to be routed on change.
      if (!thisDataset.trackVar) {
        console.error(`Could not find trackVar in dataset. Skipping...`)
        continue
      }
      const thisTrackVar = thisDataset.trackVar



      // Get Component Type from Div.dataset.
      if (! thisDataset.componentType || ! thisDataset.componentType in ReactQuickComponents.#componentRegistry ) {
        console.error('Either component-type missing from dataset, or component-type is not in component registry. Skipping...')
        failed++
        continue
      }
      const thisComponentType = thisDataset.componentType



      /*****
       * Final Steps:
       * - Create Root
       * - Store div, root, componentType, and initial Props in renderedComponents
       * - Initialize mobX store
       * - Render Component
       *  */ 
      const thisReactRoot = createRoot(div)

      this.#renderedComponents[thisInputName] = {
        div,
        root: thisReactRoot,
        componentType: thisComponentType,
        initialProps: thisProps,
        trackVar: thisTrackVar
      }

      const Component = ReactQuickComponents.#componentRegistry[thisComponentType]

      this.#propsStore.newProps(thisInputName, { 
        ...thisProps,
        onChange: (newValue) => { this.#propsStore[thisInputName][thisTrackVar] = newValue }
      })
      
      const newElement = React.createElement(
        observer(FORMAccessibleComponent(Component)),
        {
          inputName: thisInputName,
          trackVar: thisTrackVar,
          store: this.#propsStore
        }
      )

      thisReactRoot.render(newElement)

      count ++
    }

    console.log(`Rendered ${count - failed} components out of ${count} applicable divs (${failed} failed).`)
  }

  update (inputName, props) {
    this.#propsStore.updateProps(inputName, props)
  }
}

window.XCD_C = new ReactQuickComponents()
