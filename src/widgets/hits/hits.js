import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';

import Hits from '../../components/Hits.js';
import connectHits from '../../connectors/hits/connectHits.js';
import defaultTemplates from './defaultTemplates.js';

import {
  bemHelper,
  prepareTemplateProps,
  getContainerNode,
} from '../../lib/utils.js';

const bem = bemHelper('ais-hits');

const renderer = ({
  renderState,
  cssClasses,
  containerNode,
  transformData,
  templates,
}) => ({
  hits, // eslint-disable-line
  results,
  templateProps,
  instantSearchInstance,
}, isFirstRendering) => {
  if (isFirstRendering) {
    renderState.templateProps = prepareTemplateProps({
      transformData,
      defaultTemplates,
      templatesConfig: instantSearchInstance.templatesConfig,
      templates,
    });
    return;
  }

  ReactDOM.render(
    <Hits
      cssClasses={cssClasses}
      hits={hits}
      results={results}
      templateProps={renderState.templateProps}
    />,
    containerNode
  );
};

const usage = `Usage:
hits({
  container,
  [ cssClasses.{root,empty,item}={} ],
  [ templates.{empty,item} | templates.{empty, allItems} ],
  [ transformData.{empty,item} | transformData.{empty, allItems} ],
})`;

/**
 * Display the list of results (hits) from the current search
 * @function hits
 * @param  {string|DOMElement} $0.container CSS Selector or DOMElement to insert the widget
 * @param  {Object} [$0.templates] Templates to use for the widget
 * @param  {string|Function} [$0.templates.empty=''] Template to use when there are no results.
 * @param  {string|Function} [$0.templates.item=''] Template to use for each result. This template will receive an object containing a single record.
 * @param  {string|Function} [$0.templates.allItems=''] Template to use for the list of all results. (Can't be used with `item` template). This template will receive a complete SearchResults result object, this object contains the key hits that contains all the records retrieved.
 * @param  {Object} [$0.transformData] Method to change the object passed to the templates
 * @param  {Function} [$0.transformData.empty] Method used to change the object passed to the `empty` template
 * @param  {Function} [$0.transformData.item] Method used to change the object passed to the `item` template
 * @param  {Function} [$0.transformData.allItems] Method used to change the object passed to the `allItems` template
 * @param  {Object} [$0.cssClasses] CSS classes to add
 * @param  {string|string[]} [$0.cssClasses.root] CSS class to add to the wrapping element
 * @param  {string|string[]} [$0.cssClasses.empty] CSS class to add to the wrapping element when no results
 * @param  {string|string[]} [$0.cssClasses.item] CSS class to add to each result
 * @return {Object} widget instance
 */
export default function hits({
  container,
  cssClasses: userCssClasses = {},
  templates = defaultTemplates,
  transformData,
}) {
  if (!container) {
    throw new Error(`Must provide a container.${usage}`);
  }

  if (templates.item && templates.allItems) {
    throw new Error(`Must contain only allItems OR item template.${usage}`);
  }

  const containerNode = getContainerNode(container);
  const cssClasses = {
    root: cx(bem(null), userCssClasses.root),
    item: cx(bem('item'), userCssClasses.item),
    empty: cx(bem(null, 'empty'), userCssClasses.empty),
  };

  const specializedRenderer = renderer({
    containerNode,
    cssClasses,
    renderState: {},
    transformData,
    templates,
  });

  try {
    const makeHits = connectHits(specializedRenderer);
    return makeHits();
  } catch (e) {
    throw new Error(usage);
  }
}
