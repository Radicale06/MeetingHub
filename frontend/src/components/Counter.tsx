import { useSelector, useDispatch } from "react-redux";
import { Button } from "antd";
import { decrement, increment } from "../store/features/counterSlice";
import { RootState } from "../store/store";

const Counter = () => {
  const count = useSelector((state: RootState) => state.counter.value); // Use RootState
  const dispatch = useDispatch();

  return (
    <div>
      <h1>Counter: {count}</h1>
      <Button type="primary" onClick={() => dispatch(increment())}>
        Increment
      </Button>
      <Button
        style={{ marginLeft: "10px" }}
        onClick={() => dispatch(decrement())}
      >
        Decrement
      </Button>
    </div>
  );
};

export default Counter;
