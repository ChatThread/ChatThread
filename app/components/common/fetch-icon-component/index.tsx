import ForwardedIconComponent from "../generic-icon-component";

const FetchIconComponent = ({
  source,
  name,
}: {
  source: string;
  name: string;
}) => {
  return (
    <div>
      {source ? (
        <img src={source} alt={name} />
      ) : (
        <ForwardedIconComponent name="Unknown" />
      )}
    </div>
  );
};

export default FetchIconComponent;
