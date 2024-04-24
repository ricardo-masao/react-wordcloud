import debounce from 'lodash.debounce';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useResponsiveSvgSelection } from './hooks';
import { layout } from './layout';
import { getDefaultColors } from './utils';

export const defaultCallbacks = {
  getWordTooltip: ({ text, value }) => `${text} (${value})`,
};

export const defaultOptions = {
  colors: getDefaultColors(),
  deterministic: false,
  enableOptimizations: false,
  enableTooltip: true,
  fontFamily: 'times new roman',
  fontSizes: [4, 32],
  fontStyle: 'normal',
  fontWeight: 'normal',
  padding: 1,
  rotationAngles: [-90, 90],
  scale: 'sqrt',
  spiral: 'rectangular',
  tooltipOptions: {},
  transitionDuration: 600,
};

// let tags = [];

function ReactWordCloud({
  callbacks,
  maxWords = 100,
  minSize,
  options,
  size: initialSize,
  words,
  selectedWordsCloud,
  ...rest
}) {
  const [ref, selection, size] = useResponsiveSvgSelection(
    minSize,
    initialSize,
    options.svgAttributes,
  );

  const render = useRef(debounce(layout, 100));
  const [hoverTag, setHoverTag] = useState(null)
  const [rendered, setRendered] = useState(false)

  const onMainWordMouseOver = (word, event) => {
    const { onWordMouseOver } = callbacks;

    if(!!onWordMouseOver) onWordMouseOver(word)
  }

  const onMainWordMouseOut = (word, event) => {
    const { onWordMouseOut } = callbacks;

    if(!!onWordMouseOut) onWordMouseOut(word)
  }
  
  const onMainWordClick = (word, event) => {
    const { onWordClick } = callbacks;

    if(!!onWordClick) onWordClick(word)
  }

  useEffect(() => {
    if(!!selection) {
      selection.selectAll('text')
        .on('mouseover', function (e,d) {
          const { onWordMouseOver } = callbacks;

          setHoverTag({
            element: this,
            props: e
          })

          if(!!onWordMouseOver) onWordMouseOver(e)
        })
        .on('mouseout', (e,d) => {
          const { onWordMouseOut } = callbacks;
          setHoverTag(null)
          if(!!onWordMouseOut) onWordMouseOut(e)
        })
    }
  }, [rendered, selectedWordsCloud])

  useEffect(() => {
    if(!!selection) {
      selection.selectAll('text')
        .attr('selected', function () {
          const label = this.innerHTML;
          return (selectedWordsCloud.some(t => t.props.text === label) ? 'true' : '')
        })
        .on('click', function (e,d) {
          const { onWordClick } = callbacks;
          if(!!onWordClick) onWordClick({
            element: this,
            props: e
          })
        })
    }
  }, [rendered, selectedWordsCloud])

  const onRendered = useCallback(() => {
    setRendered(true)
  }, [])

  const tags = useMemo(() => {
    return selectedWordsCloud.map((t) => {
      const { parentElement } = t.element;
      const {left:elementLeft, top:elementTop, width: elementWidth} = t.element.getBoundingClientRect();
      const {left:parentElementLeft, top:parentElementTop} = parentElement.getBoundingClientRect();
      const svg = parentElement.parentElement
      const { left:svgLeft, top:svgTop } = svg.getBoundingClientRect();
      const margin = { left: parentElementLeft - svgLeft, top: parentElementTop - svgTop}
      const { fontSizes, fontFamily } = options;
      const fontSize = t.props.size;
      const hasRotate = t.element.getAttribute("transform")?.includes("rotate")

      const tagStyle = {
        backgroundColor: "#FFF",
        border: "1px solid",
        borderRadius: "20px",
        boxSizing: "border-box",
        padding: "2px 4px",
        position: "absolute",
        fontSize: "7px", // TODO GIO - Mudar o tamanho da font aqui via props
        fontFamily: fontFamily,
        right: hasRotate ? `${Math.abs(fontSizes[0] - fontSize) / 2}px` : "0px",
        bottom: hasRotate ? '5px': `${(fontSizes[0] - fontSize) / 2}px`, // Quanto maior a font, maior o bottom NEGATIVO
      }

      const containerTagStyle = {
        position: "absolute",
        left: `${elementLeft - parentElementLeft + margin.left}px`,
        top: `${elementTop - parentElementTop + margin.top}px`,
        textAlign: "right",
        width: elementWidth
      }

      return (
        // @ts-ignore
        <span style={containerTagStyle}>
          {/*@ts-ignore*/}
          <span style={tagStyle}>{t.props.value}</span>
        </span>
      )
    })
  }, [selectedWordsCloud, rendered])

  useEffect(() => {
    if (selection) {
      setRendered(false)
      const { onWordMouseOver, onWordMouseOut, onWordClick, ...restCallbacks } = callbacks;
      const mergedCallbacks = { ...defaultCallbacks, onWordClick: undefined, onWordMouseOver:undefined, onWordMouseOut: undefined, ...restCallbacks};
      const mergedOptions = { ...defaultOptions, ...options };

      render.current({
        callbacks: mergedCallbacks,
        maxWords,
        options: mergedOptions,
        selection,
        size,
        words,
        onRendered: onRendered
      });
    }
  }, [maxWords, options, selection, size, words, onRendered]);

  return <div className='ReactWordCloud' style={ { height: '100%', width: '100%', position: "relative" } }>
    <div ref={ref} style={{ height: '100%', width: '100%' }} {...rest} />
    {tags}
  </div>;
}

ReactWordCloud.defaultProps = {
  callbacks: defaultCallbacks,
  maxWords: 100,
  minSize: [300, 300],
  options: defaultOptions,
  selectedWordsCloud: []
};

export default ReactWordCloud;
