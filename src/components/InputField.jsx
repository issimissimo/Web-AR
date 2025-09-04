
import { createSignal, Show } from 'solid-js';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import Fa from 'solid-fa';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';


// --- Styled Components ---
const InputFieldContainer = styled('div')`
  position: relative;
  height: 2.75rem;
  display: flex;
  align-items: center;
`;

const InputWrapper = styled('div')`
  position: relative;
  margin-bottom: 1rem;
  width: 100%;
`;

const Input = styled('input')`
  width: 100%;
  padding: 0.9rem 1rem;
  border: none;
  border-radius: 90px;
  border-color: ${props => props['data-error'] ? 'var(--color-primary)' : '#adb5bd;'};
  transition: all 0.3s ease;
  background: var(--color-dark-transparent);
  box-sizing: border-box;
  color: var(--color-white);
  padding-left: 1.5rem;
  position: relative;
  z-index: 1;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props['data-error'] ? 'var(--color-primary)' : 'var(--color-primary)'};
    box-shadow: none;
  }

  &::placeholder {
    color: #adb5bd;
  }

  &[type="password"] {
    padding-right: 3rem;
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

const Label = styled('div')`
  position: absolute;
  left: 0;
  bottom: 0;
  top: 0;
  /* padding-left: 1.5rem; */
  pointer-events: none;
  display: flex;
  align-items: center;
  background: transparent;
  font-weight: 500;
  font-size: 0.9rem;
  transition: color 0.3s;
`;

const FloatingLabel = styled(Motion.div)`
  position: absolute;
  left: 1.5rem;
  top: 0;
  height: 100%;
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
  color: var(--color-secondary);
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

// --- FloatingInput Component ---
const InputField = (props) => {
  const [isFocused, setIsFocused] = createSignal(false);
  const [showPassword, setShowPassword] = createSignal(false);
  const inputType = () => props.type === 'password' ? (showPassword() ? 'text' : 'password') : props.type;

  return (
    <InputWrapper style={props.style}>
      <InputFieldContainer>
        <FloatingLabel
          animate={{
            x: isFocused() || props.value ? -20 : 0,
            y: isFocused() || props.value ? -35 : 0,
            scale: isFocused() || props.value ? 0.8 : 1,
            color: isFocused() ? (props['data-error'] ? 'var(--color-primary)' : 'var(--color-grey)') : 'var(--color-secondary)',
          }}
          transition={{ duration: 0.3, easing: 'ease-in-out' }}
        >
          <Label>{props.label}</Label>
        </FloatingLabel>
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
        {/* Eye icon for password */}
        {props.type === 'password' && (
          <EyeButton type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword() ? 'Nascondi password' : 'Mostra password'}>
            <Fa icon={showPassword() ? faEyeSlash : faEye} color='var(--color-grey)' />
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