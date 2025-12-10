import { createSignal, Show} from "solid-js"
import { styled } from "solid-styled-components"

const SliderContainer = styled("div")`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 10px;
    /* max-width: 400px; */
    width: 80%;
`

const SliderLabel = styled("label")`
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: white;
`

const SliderInput = styled("input")`
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(to right, #e0e0e0 0%, #60a5fa 0%);
    outline: none;
    -webkit-appearance: none;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #60a5fa;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.1s ease;

        &:hover {
            transform: scale(1.2);
        }
    }

    &::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #60a5fa;
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

        &:hover {
            transform: scale(1.2);
        }
    }
`

const ValueDisplay = styled("span")`
    /* font-weight: bold; */
    color: white;
    min-width: 40px;
    text-align: right;
`

function HorizontalSlider(props) {
    const [value, setValue] = createSignal(props.default ?? 0.5)

    const min = () => parseFloat(props.min ?? 0.1)
    const max = () => parseFloat(props.max ?? 1)

    const handleChange = (e) => {
        const newValue = parseFloat(e.target.value)
        setValue(newValue)
        props.onChange?.(newValue)
    }

    // Calcola la percentuale corretta basandosi su min e max dinamici
    const percentage = () => {
        const range = max() - min()
        return ((value() - min()) / range) * 100
    }

    return (
      <SliderContainer>
        <Show when={props.showLabel ?? true}>
          <SliderLabel>
            <span>{props.label ?? "Value"}</span>
            <Show when={props.showValue ?? true}>
              <ValueDisplay>
                {value().toFixed(props.decimals ?? 2)}
              </ValueDisplay>
            </Show>
          </SliderLabel>
        </Show>
        <SliderInput
          type="range"
          min={min()}
          max={max()}
          step={props.step ?? "0.01"}
          value={value()}
          onInput={handleChange}
          style={{
            background: `linear-gradient(to right, #60a5fa 0%, #60a5fa ${percentage()}%, #e0e0e061 ${percentage()}%, #e0e0e061 100%)`,
          }}
        />
      </SliderContainer>
    )
}

export default HorizontalSlider
