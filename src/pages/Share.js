import { useParams } from "react-router-dom";
import { useEffect } from "react";

export default function Share() {
  const { token } = useParams();

  useEffect(() => {
    window.location.href = `${process.env.REACT_APP_API_URL}/files/public/${token}`;
  }, [token]);

  return <p className="text-center mt-20">Opening shared file...</p>;
}
