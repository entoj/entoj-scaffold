
/**
 * Requirements
 */
import { Component as BaseComponent } from 'global/component';

/**
 * @memberOf <$ entityId.site.name.toLowerCase() $>.<$ entityId.category.longName.toLowerCase() $>.<$ entityId.asString('id') $>
 */
export class Component extends BaseComponent {

    /* Constants ------------------------------------------------------------------------------- */
    /* Constructor ----------------------------------------------------------------------------- */

    /**
     * @param {Application} application
     * @param {DOMElement} $element
     */
    constructor(application, $element) {
        super(application, $element);

        // Selectors
        Object.assign(this.selectors, {
        });

        // Handler bindings
        Object.assign(this.bindings, {
        });
    }


    /**
     * @inheritDocs
     */
    static get className() {
        return '<$ entityId.site.name.toLowerCase() $>.<$ entityId.category.longName.toLowerCase() $>.<$ entityId.asString('id') $>/Component';
    }


    /* Lifecycle ------------------------------------------------------------------------------- */
    /* Eventhandler ---------------------------------------------------------------------------- */
    /* Protected ------------------------------------------------------------------------------- */
    /* Public ---------------------------------------------------------------------------------- */
}
