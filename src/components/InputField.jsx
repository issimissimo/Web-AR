import { createSignal, Show } from 'solid-js';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import Fa from 'solid-fa';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';


// --- Styled Components ---
const InputFieldContainer = styled('div')`
  position: relative;
  min-height: 2.75rem;
  display: flex;
  align-items: ${props => props['data-multiline'] ? 'flex-start' : 'center'};
`;

const InputWrapper = styled('div')`
  position: relative;
  margin-bottom: 1rem;
  width: 100%;
`;

const baseInputStyles = `
  width: 100%;
  padding: 0.9rem 1rem;
  border: none;
  border-radius: 90px;
  transition: all 0.3s ease;
  background: var(--color-dark-transparent);
  box-sizing: border-box;
  color: var(--color-primary);
  padding-left: 1.5rem;
  position: relative;
  z-index: 1;
  font-size: var(--font-size-regular);
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: none;
  }

  &::placeholder {
    color: #adb5bd;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active {
    color: #fff !important;
    background: transparent !important;
    box-shadow: 0 0 0 1000px transparent inset !important;
    -webkit-text-fill-color: #fff !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

const Input = styled('input')`
  ${baseInputStyles}
  border-color: ${props => props['data-error'] ? 'var(--color-primary)' : '#adb5bd'};

  &[type="password"] {
    padding-right: 3rem;
  }
  background: #27272756;
`;

const TextArea = styled('textarea')`
  ${baseInputStyles}
  border-color: ${props => props['data-error'] ? 'var(--color-primary)' : '#adb5bd'};
  border-radius: 20px;
  min-height: ${props => props['data-rows'] ? `${props['data-rows'] * 1.5 + 1.8}rem` : '6rem'};
  resize: ${props => props['data-resize'] || 'vertical'};
  padding-top: 0.9rem;
  line-height: 1.5;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--color-grey);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-primary);
  }
`;

const Label = styled('div')`
  position: absolute;
  left: 0;
  bottom: 0;
  top: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  background: transparent;
  font-size: var(--font-size-medium);
  transition: color 0.3s;
`;

const FloatingLabel = styled(Motion.div)`
  position: absolute;
  left: 1.5rem;
  top: ${props => props['data-multiline'] ? '0.9rem' : '0'};
  height: ${props => props['data-multiline'] ? 'auto' : '100%'};
  width: 200px;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 2;
`;

const ErrorContainer = styled('div')`
  min-height: 1.2em;
  margin-top: 0.3rem;
  margin-left: 1.5rem;
  display: flex;
  align-items: flex-start;
`;

const ErrorMsg = styled('span')`
  color: var(--color-accent);
  font-size: 0.75rem;
`;

const EyeButton = styled('button')`
  position: absolute;
  right: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  z-index: 3;
  display: flex;
  align-items: center;
  &:focus {
    outline: none;
    background: none;
  }
  &:active {
    background: none;
  }
`;

// --- InputField Component ---
const InputField = (props) => {
  const [isFocused, setIsFocused] = createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);
  const inputType = () => props.type === 'password' ? (showPassword() ? 'text' : 'password') : props.type;
  const isMultiline = () => props.multiline || false;

  return (
    <InputWrapper style={props.style}>
      <InputFieldContainer data-multiline={isMultiline()}>
        <FloatingLabel
          data-multiline={isMultiline()}
          animate={{
            x: isFocused() || props.value ? -20 : 0,
            y: isFocused() || props.value ? -35 : 0,
            scale: isFocused() || props.value ? 0.8 : 1,
            color: isFocused() ? (props['data-error'] ? 'var(--color-accent)' : 'var(--color-secondary)') : 'var(--color-primary)',
          }}
          transition={{ duration: 0.3, easing: 'ease-in-out' }}
        >
          <Label>{props.label}</Label>
        </FloatingLabel>
        
        <Show
          when={isMultiline()}
          fallback={
            <Input
              class="glass"
              type={inputType()}
              name={props.name}
              value={props.value}
              onInput={props.onInput}
              onFocus={e => {
                setIsFocused(true);
                props.onFocus && props.onFocus(e);
              }}
              onBlur={() => {
                props.onBlur;
                setIsFocused(false)
              }}
              autoComplete={props.autoComplete}
              required={props.required}
              placeholder={props.placeholder}
              data-error={props['data-error']}
            />
          }
        >
          <TextArea
            class="glass"
            name={props.name}
            value={props.value}
            onInput={props.onInput}
            onFocus={e => {
              setIsFocused(true);
              props.onFocus && props.onFocus(e);
            }}
            onBlur={() => {
              props.onBlur;
              setIsFocused(false)
            }}
            required={props.required}
            placeholder={props.placeholder}
            data-error={props['data-error']}
            data-rows={props.rows}
            data-resize={props.resize}
          />
        </Show>

        {/* Eye icon for password */}
        {props.type === 'password' && !isMultiline() && (
          <EyeButton type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword() ? 'Nascondi password' : 'Mostra password'}>
            <Fa icon={showPassword() ? faEyeSlash : faEye} color='var(--color-primary)' />
          </EyeButton>
        )}
      </InputFieldContainer>
      <ErrorContainer>
        <Show when={props.error}>
          <ErrorMsg>{props.error}</ErrorMsg>
        </Show>
      </ErrorContainer>
    </InputWrapper>
  );
}

export default InputField