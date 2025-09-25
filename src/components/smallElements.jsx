import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';

export const Container = styled(Motion.div)`
    /* padding: 1.5em; */
    box-sizing: border-box;
    width: 100%;
    max-width: 500px;
    display: flex;
    flex-direction: column;
    height: 100%;
    z-index: 1;
  `;

export const Centered = styled(Container)`
    align-items: center;
    justify-content: space-evenly;
    margin: auto;
  `;

export const FitHeight = styled(Motion.div)`
    margin-bottom: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  `;

export const FitHeightScrollable = styled(FitHeight)`
    overflow-y: auto;
  `;

export const BigTitle = styled(Motion.p)`
    font-size: 2.6rem;
    font-family: "Montessori";
    line-height: 120%;
    margin: 0;
  `;

export const Title = styled(Motion.p)`
  font-size: 1.8rem;
  font-family: "Montessori";
  line-height: 100%;
  color: ${props => props.color ?? props.color};
  /* margin: 0; */
  margin-top: 1rem;
  margin-bottom: 1rem;

  span {
    vertical-align: text-top;
  }
  `;

