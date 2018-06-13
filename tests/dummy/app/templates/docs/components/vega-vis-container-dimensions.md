# Vega Vis Container Dimensions

This component yields an object that contains two properties:

* `element` - the component's element.
* `dimensions` - component element's [`getBoundingClientRect`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).

## Dimensions Property

The `dimensions` is bound to the `window` `resize` event, so whenever the window resizes, the `dimensions` will be updated.

It's useful for computing aspect ratios making `vega-vis` responsive.

{{#docs-demo as |demo|}}
    {{#vega-vis-demo-basic as |spec|}}
        {{#demo.example name="vega-vis-container-dimensions-demo.hbs"}}
            {{#vega-vis-container-dimensions as |ui|}}
                {{vega-vis 
                    spec=spec
                    height=(div ui.dimensions.width 3)
                    width=ui.dimensions.width
                }}
            {{/vega-vis-container-dimensions}}
        {{/demo.example}}
    {{/vega-vis-demo-basic}}
    
    {{demo.snippet name="vega-vis-container-dimensions-demo.hbs"}}
{{/docs-demo}}

Alternatively, a spec can have use the [`containerSize` expression](https://vega.github.io/vega/docs/expressions/#containerSize) to make the visualization responsive.

The example below show's width and height signals that update the when the windows resize event is triggered.

```json
{
    "signals": [
        {
            "name": "width",
            "update": "(containerSize()[0] || 400)",
            "on": [{
                "events": {"source": "window", "type": "resize"},
                "update": "containerSize()[0]"
            }]
        },
        
        {
            "name": "height",
            "update": "(containerSize()[1] || 200)",
            "on": [{
                "events": {"source": "window", "type": "resize"},
                "update": "containerSize()[1]"
            }]
        }
    ]
}
```

If you have a `spec` that makes use of this feature, there is no need to use `vega-vis-container-dimensions` component in this scenario.

## Container Property

With the `container` property, the `vega-vis` can render the visualization in a different element from it's own. This helps with reducing the number of elements in the DOM and can help with debugging.

Note that a `tagName` property is passed to `vega-vis`, along with the `container`. Since `vega-vis` will be rendering the visualization in a different element, setting the `tagName` to an empty string will prevent `vega-vis` from creating an element of its own.

{{#docs-demo as |demo|}}
    {{#vega-vis-demo-basic as |spec|}}
        {{#demo.example name="vega-vis-container-dimensions-element-demo.hbs"}}
            {{#vega-vis-container-dimensions as |ui|}}
                {{vega-vis 
                    spec=spec
                    height=(div ui.dimensions.width 3)
                    width=ui.dimensions.width
                    container=ui.container
                    tagName=""
                }}
            {{/vega-vis-container-dimensions}}
        {{/demo.example}}
    {{/vega-vis-demo-basic}}
    
    {{demo.snippet name="vega-vis-container-dimensions-element-demo.hbs"}}
{{/docs-demo}}