import { makeAutoObservable, observable, action } from 'mobx';

class UIStore {
    headerActions = null;

    constructor() {
        makeAutoObservable(this, {
            headerActions: observable.ref,
            setHeaderActions: action.bound,
            clearHeaderActions: action.bound
        });
    }

    setHeaderActions(actions) {
        this.headerActions = actions;
    }

    clearHeaderActions() {
        this.headerActions = null;
    }
}

export const uiStore = new UIStore();
