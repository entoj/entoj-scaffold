/**
 * Requirements
 */
import { Base } from 'global/base';


/**
 * This file was generated via 'entoj scaffold breakpoint'
 *
 * @memberOf base.global
 */
export class Breakpoints extends Base
{
    /* Constants ------------------------------------------------------------------------- */

<% for name, settings in breakpoints %>
    /**
     * @property {String}
     */
    static get <$ name.toUpperCase() $>()
    {
        return '<$ name.dasherize() $>';
    }
<% endfor %>

    /* Constructor ----------------------------------------------------------------------- */

    /**
     */
    constructor()
    {
        super();
        this.current = Breakpoints.DESKTOP;
        this.breakpoints = [];
        <% for name, settings in breakpoints %>this.breakpoints.push({ name: '<$ name.dasherize() $>', mediaQuery: '<$ name|mediaQuery $>' });
        <% endfor %>
    }


    /**
     * Resolves to the name of the current breakpoint
     */
    determine()
    {
        let bp = Breakpoints.DESKTOP;
        for (let breakpoint of this.breakpoints)
        {
            if (window.matchMedia(breakpoint.mediaQuery).matches)
            {
                bp = breakpoint.name;
            }
        }
        let changed = this.current !== bp;
        this.current = bp;
        return Promise.resolve(changed);
    }
}
