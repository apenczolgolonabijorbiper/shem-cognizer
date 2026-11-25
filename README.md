# shem-cognizer
Optional cognizer that brings Golem14-harness to life in Chelm-host through local or remote cognitive processing

## Implementation plan

Shem is currently a planned project. Its optional cognizer will perform
Harness-defined observation analysis and memory-backed cognitive tasks using
replaceable AI API and agent adapters. Chelm remains the owner of storage,
authorization and publication; other agents may continue to use Chelm directly.

- [Implementation tracker #1](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/1)
- [Architecture and phased implementation plan](docs/IMPLEMENTATION_PLAN.md)

The plan contains 15 work packages with dependencies and acceptance criteria.
The latest published Harness is 0.14.0; published Chelm 1.3.0 supports Harness
0.13.0 exactly. The plan explicitly tracks the supported-pair alignment required
before a Shem release can claim compatibility with the latest capabilities.

The existing Chelm + Harness + configured agent workflow remains the initial
reference cognizer. Shem will reuse its procedures and retained experience,
then undergo comparative qualification. A later explicit promotion can make
Shem the reference for new integrations while retaining the independently
usable base as an optional supported path. See [base inventory #15](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/15)
and [reference succession #16](https://github.com/apenczolgolonabijorbiper/shem-cognizer/issues/16).
