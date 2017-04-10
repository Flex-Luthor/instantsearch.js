import sinon from 'sinon';
import jsHelper from 'algoliasearch-helper';
const SearchResults = jsHelper.SearchResults;
import connectNumericRefinementList from '../connectNumericRefinementList.js';
const fakeClient = {addAlgoliaAgent: () => {}};

describe('connectNumericRefinementList', () => {
  it('Renders during init and render', () => {
    // test that the dummyRendering is called with the isFirstRendering
    // flag set accordingly
    const rendering = sinon.stub();
    const makeWidget = connectNumericRefinementList(rendering);
    const widget = makeWidget({
      attributeName: 'numerics',
      options: [
        {name: 'below 10', end: 10},
        {name: '10 - 20', start: 10, end: 20},
        {name: 'more than 20', start: 20},
      ],
    });

    expect(widget.getConfiguration).toBe(undefined);

    // test if widget is not rendered yet at this point
    expect(rendering.callCount).toBe(0);

    const helper = jsHelper(fakeClient);
    helper.search = sinon.stub();

    widget.init({
      helper,
      state: helper.state,
      createURL: () => '#',
      onHistoryChange: () => {},
    });

    // test that rendering has been called during init with isFirstRendering = true
    expect(rendering.callCount).toBe(1);
    // test if isFirstRendering is true during init
    expect(rendering.lastCall.args[1]).toBe(true);
    expect(rendering.lastCall.args[0].widgetParams).toEqual({
      attributeName: 'numerics',
      options: [
        {name: 'below 10', end: 10},
        {name: '10 - 20', start: 10, end: 20},
        {name: 'more than 20', start: 20},
      ],
    });

    widget.render({
      results: new SearchResults(helper.state, [{nbHits: 0}]),
      state: helper.state,
      helper,
      createURL: () => '#',
    });

    // test that rendering has been called during init with isFirstRendering = false
    expect(rendering.callCount).toBe(2);
    expect(rendering.lastCall.args[1]).toBe(false);
    expect(rendering.lastCall.args[0].widgetParams).toEqual({
      attributeName: 'numerics',
      options: [
        {name: 'below 10', end: 10},
        {name: '10 - 20', start: 10, end: 20},
        {name: 'more than 20', start: 20},
      ],
    });
  });

  it('Provide a function to update the refinements at each step', () => {
    const rendering = sinon.stub();
    const makeWidget = connectNumericRefinementList(rendering);
    const widget = makeWidget({
      attributeName: 'numerics',
      options: [
        {name: 'below 10', end: 10},
        {name: '10 - 20', start: 10, end: 20},
        {name: 'more than 20', start: 20},
        {name: '42', start: 42, end: 42},
        {name: 'void'},
      ],
    });

    const helper = jsHelper(fakeClient);
    helper.search = sinon.stub();

    widget.init({
      helper,
      state: helper.state,
      createURL: () => '#',
      onHistoryChange: () => {},
    });

    const firstRenderingOptions = rendering.lastCall.args[0];
    const {refine, items} = firstRenderingOptions;
    expect(helper.state.getNumericRefinements('numerics')).toEqual({});
    refine(items[0].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({'<=': [10]});
    refine(items[1].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({'>=': [10], '<=': [20]});
    refine(items[2].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({'>=': [20]});
    refine(items[3].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({'=': [42]});
    refine(items[4].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({});

    widget.render({
      results: new SearchResults(helper.state, [{}]),
      state: helper.state,
      helper,
      createURL: () => '#',
    });

    const secondRenderingOptions = rendering.lastCall.args[0];
    const {refine: renderToggleRefinement, items: renderFacetValues} = secondRenderingOptions;
    expect(helper.state.getNumericRefinements('numerics')).toEqual({});
    renderToggleRefinement(renderFacetValues[0].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({'<=': [10]});
    renderToggleRefinement(renderFacetValues[1].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({'>=': [10], '<=': [20]});
    renderToggleRefinement(renderFacetValues[2].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({'>=': [20]});
    renderToggleRefinement(renderFacetValues[3].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({'=': [42]});
    renderToggleRefinement(renderFacetValues[4].name);
    expect(helper.state.getNumericRefinements('numerics')).toEqual({});
  });

  it('provides the correct facet values', () => {
    const rendering = sinon.stub();
    const makeWidget = connectNumericRefinementList(rendering);
    const widget = makeWidget({
      attributeName: 'numerics',
      options: [
        {name: 'below 10', end: 10},
        {name: '10 - 20', start: 10, end: 20},
        {name: 'more than 20', start: 20},
      ],
    });

    const helper = jsHelper(fakeClient);
    helper.search = sinon.stub();

    widget.init({
      helper,
      state: helper.state,
      createURL: () => '#',
      onHistoryChange: () => {},
    });

    const firstRenderingOptions = rendering.lastCall.args[0];
    expect(firstRenderingOptions.items).toEqual([
      {name: 'below 10', end: 10, isRefined: false, attributeName: 'numerics'},
      {name: '10 - 20', start: 10, end: 20, isRefined: false, attributeName: 'numerics'},
      {name: 'more than 20', start: 20, isRefined: false, attributeName: 'numerics'},
    ]);

    widget.render({
      results: new SearchResults(helper.state, [{}]),
      state: helper.state,
      helper,
      createURL: () => '#',
    });

    const secondRenderingOptions = rendering.lastCall.args[0];
    expect(secondRenderingOptions.items).toEqual([
      {name: 'below 10', end: 10, isRefined: false, attributeName: 'numerics'},
      {name: '10 - 20', start: 10, end: 20, isRefined: false, attributeName: 'numerics'},
      {name: 'more than 20', start: 20, isRefined: false, attributeName: 'numerics'},
    ]);
  });

  it('provides isRefined for the currently selected value', () => {
    const rendering = sinon.stub();
    const makeWidget = connectNumericRefinementList(rendering);
    const listOptions = [
      {name: 'below 10', end: 10},
      {name: '10 - 20', start: 10, end: 20},
      {name: 'more than 20', start: 20},
      {name: '42', start: 42, end: 42},
      {name: 'void'},
    ];
    const widget = makeWidget({
      attributeName: 'numerics',
      options: listOptions,
    });

    const helper = jsHelper(fakeClient);
    helper.search = sinon.stub();

    widget.init({
      helper,
      state: helper.state,
      createURL: () => '#',
      onHistoryChange: () => {},
    });

    let refine = rendering.lastCall.args[0].refine;

    listOptions.forEach((currentOption, i) => {
      refine(currentOption.name);

      widget.render({
        results: new SearchResults(helper.state, [{}]),
        state: helper.state,
        helper,
        createURL: () => '#',
      });

      // The current option should be the one selected
      // First we copy and set the default added values
      const expectedResults = [...listOptions].map(o => ({...o, isRefined: false, attributeName: 'numerics'}));
      // Then we modify the isRefined value of the one that is supposed to be refined
      expectedResults[i].isRefined = true;

      const renderingParameters = rendering.lastCall.args[0];
      expect(renderingParameters.items).toEqual(expectedResults);

      refine = renderingParameters.refine;
    });
  });

  it('when the state is cleared, the "no value" value should be refined', () => {
    const rendering = sinon.stub();
    const makeWidget = connectNumericRefinementList(rendering);
    const listOptions = [
      {name: 'below 10', end: 10},
      {name: '10 - 20', start: 10, end: 20},
      {name: 'more than 20', start: 20},
      {name: '42', start: 42, end: 42},
      {name: 'void'},
    ];
    const widget = makeWidget({
      attributeName: 'numerics',
      options: listOptions,
    });

    const helper = jsHelper(fakeClient);
    helper.search = sinon.stub();

    widget.init({
      helper,
      state: helper.state,
      createURL: () => '#',
      onHistoryChange: () => {},
    });

    const refine = rendering.lastCall.args[0].refine;
    // a user selects a value in the refinement list
    refine(listOptions[0].name);

    widget.render({
      results: new SearchResults(helper.state, [{}]),
      state: helper.state,
      helper,
      createURL: () => '#',
    });

    // No option should be selected
    const expectedResults0 = [...listOptions].map(o => ({...o, isRefined: false, attributeName: 'numerics'}));
    expectedResults0[0].isRefined = true;

    const renderingParameters0 = rendering.lastCall.args[0];
    expect(renderingParameters0.items).toEqual(expectedResults0);

    // All the refinements are cleared by a third party
    helper.removeNumericRefinement('numerics');

    widget.render({
      results: new SearchResults(helper.state, [{}]),
      state: helper.state,
      helper,
      createURL: () => '#',
    });

    // No option should be selected
    const expectedResults1 = [...listOptions].map(o => ({...o, isRefined: false, attributeName: 'numerics'}));
    expectedResults1[4].isRefined = true;

    const renderingParameters1 = rendering.lastCall.args[0];
    expect(renderingParameters1.items).toEqual(expectedResults1);
  });
});
