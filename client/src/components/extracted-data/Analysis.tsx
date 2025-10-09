import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import ReactMarkdown from "react-markdown";

const Analysis = ({ title, sub_title, result }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{sub_title}</CardDescription>
      </CardHeader>
      <CardContent>
        <ReactMarkdown>{result}</ReactMarkdown>
      </CardContent>
    </Card>
  );
};

export default Analysis