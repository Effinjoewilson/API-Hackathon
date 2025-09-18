export default function About() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-600">About the Hackathon</h1>
      <p className="text-lg text-gray-700">
        The <strong>API Development & Integration Hackathon</strong> is focused on building
        next-generation developer tools and platforms that streamline API workflows.
      </p>

      <p className="text-gray-600">
        Participants will work on solutions that:
      </p>

      <ul className="list-disc pl-6 space-y-2 text-gray-800">
        <li>Configure secure API endpoints with authentication and rate-limits.</li>
        <li>Connect APIs seamlessly to multiple relational and NoSQL databases.</li>
        <li>Design intuitive drag-and-drop tools for visual API–DB mapping.</li>
        <li>Test and validate data pipelines end-to-end.</li>
        <li>Integrate AI assistants to generate code, documentation, and test suites.</li>
      </ul>

      <p className="text-gray-600">
        This hackathon empowers developers to innovate faster and build robust, scalable,
        and intelligent API ecosystems 🚀
      </p>
    </section>
  );
}
