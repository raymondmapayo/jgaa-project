import { Card, Typography, Grid } from "antd";
import cardImg from "../../../public/assets/cards.png";
import cardImge from "../../../public/assets/f1.jpeg";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface Props {
  fname: string;
}

const WelcomeCard = ({ fname }: Props) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        minHeight: isMobile ? 320 : 220,
        background: "linear-gradient(145deg, #0a0a0a, #1a1a1a)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
      }}
      styles={{
        body: {
          padding: isMobile ? 18 : 24,
          display: "flex",
          flexDirection: "column",
          alignItems: isMobile ? "center" : "flex-start",
          textAlign: isMobile ? "center" : "left",
          gap: 10,
        },
      }}
    >
      {/* TOP TEXT SECTION */}
      <Title
        style={{
          color: "#fff",
          marginBottom: 0,
        }}
        level={isMobile ? 4 : 3}
      >
        Welcome back 👋
      </Title>

      <Title
        style={{
          color: "#fff",
          marginTop: 0,
        }}
        level={isMobile ? 5 : 4}
      >
        {fname}
      </Title>

      <Text
        style={{
          color: "rgba(255,255,255,0.75)",
          display: "block",
          maxWidth: 420,
        }}
      >
        Have a productive and great day ahead. Everything you need is ready in
        your dashboard.
      </Text>

      {/* HUMAN IMAGE (NOW ALWAYS AT BOTTOM ON MOBILE) */}
      <div
        style={{
          marginTop: isMobile ? 20 : 0,
          width: "100%",
          display: "flex",
          justifyContent: isMobile ? "center" : "flex-end",
          position: "relative",
        }}
      >
        {/* decorative card image */}
        <img
          src={cardImg}
          alt=""
          style={{
            position: "absolute",
            width: isMobile ? 140 : 220,
            bottom: 0,
            opacity: 0.85,
            transform: isMobile
              ? "rotate(-10deg)"
              : "translateX(-40px) rotate(-14deg)",
          }}
        />

        {/* main character */}
        <img
          src="https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/illustrations/characters/character-present.webp"
          alt=""
          style={{
            height: isMobile ? 140 : 160,
            zIndex: 2,
          }}
        />
      </div>

      {/* background decoration */}
      <img
        src={cardImge}
        alt=""
        style={{
          position: "absolute",
          left: -20,
          bottom: -10,
          width: isMobile ? 180 : 280,
          opacity: 0.08,
          transform: "rotate(10deg)",
          pointerEvents: "none",
        }}
      />
    </Card>
  );
};

export default WelcomeCard;
